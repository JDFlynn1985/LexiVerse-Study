
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { aiStudyAssistant } from '@/ai/flows/ai-study-assistant';

/**
 * @fileOverview RESTful API Endpoint for Scholarly Research.
 * Supports tiered rate limiting based on API keys managed in the Admin panel.
 */

export async function POST(req: NextRequest) {
  const { firestore } = initializeFirebase();
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const apiKeyString = authHeader.split(' ')[1];

  try {
    // 1. Validate API Key
    const keysRef = collection(firestore, 'api_keys');
    const q = query(keysRef, where('key', '==', apiKeyString), where('revoked', '==', false));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 403 });
    }

    const keyDoc = querySnapshot.docs[0];
    const keyData = keyDoc.data();

    // 2. Check Tier Limits
    const configSnap = await getDoc(doc(firestore, 'system', 'config'));
    const systemConfig = configSnap.data();
    const tiers = systemConfig?.apiTiers || [];
    const userTier = tiers.find((t: any) => t.name === keyData.tier);
    
    const dailyLimit = userTier?.requestsPerDay || 10; // Fallback to safe default
    
    // Usage check (Simple daily increment for prototype)
    if (keyData.usageCount >= dailyLimit) {
      return NextResponse.json({ error: 'Tier rate limit exceeded' }, { status: 429 });
    }

    // 3. Process Request
    const body = await req.json();
    const { term, researchContext } = body;

    if (!term) {
      return NextResponse.json({ error: 'Missing required field: term' }, { status: 400 });
    }

    // Execute flow using system defaults if user preferences aren't available for external keys
    const result = await aiStudyAssistant({
      term,
      researchContext: researchContext || [],
      model: systemConfig?.defaultModel || 'googleai/gemini-2.5-flash',
      apiKey: systemConfig?.geminiApiKey || undefined
    });

    // 4. Update Usage Analytics
    await updateDoc(doc(firestore, 'api_keys', keyDoc.id), {
      usageCount: increment(1),
      lastUsedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        tier: keyData.tier,
        remaining: Math.max(0, dailyLimit - (keyData.usageCount + 1))
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during research processing' }, { status: 500 });
  }
}
