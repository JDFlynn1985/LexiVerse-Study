import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { aiStudyAssistant } from '@/ai/flows/ai-study-assistant';

/**
 * @fileOverview RESTful API Endpoint for External Scholarly Research.
 * 
 * This endpoint allows third-party integrations (e.g., Python scripts, desktop research tools)
 * to interact with the LexiVerse research engine. Access is governed by a 
 * tiered rate-limiting model configured in the System Control Panel.
 * 
 * Headers:
 * - Authorization: Bearer [lv_api_key]
 * 
 * Body (JSON):
 * - term: string (Required) - The research topic or scripture reference.
 * - researchContext: string[] (Optional) - Excerpts from papers for RAG context.
 */

export async function POST(req: NextRequest) {
  const { firestore } = initializeFirebase();
  const authHeader = req.headers.get('Authorization');

  // Authentication Check
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const apiKeyString = authHeader.split(' ')[1];

  try {
    // 1. API Key Validation & Governance
    const keysRef = collection(firestore, 'api_keys');
    const q = query(keysRef, where('key', '==', apiKeyString), where('revoked', '==', false));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 403 });
    }

    const keyDoc = querySnapshot.docs[0];
    const keyData = keyDoc.data();

    // 2. Tiered Rate Limit Verification
    // Tiers are managed globally in /admin/api to balance server load.
    const configSnap = await getDoc(doc(firestore, 'system', 'config'));
    const systemConfig = configSnap.data();
    const tiers = systemConfig?.apiTiers || [];
    const userTier = tiers.find((t: any) => t.name === keyData.tier);
    
    const dailyLimit = userTier?.requestsPerDay || 10; // Fallback to introductory limit
    
    // Usage check (Simple counter for prototype; production should use windowed limits)
    if (keyData.usageCount >= dailyLimit) {
      return NextResponse.json({ error: 'Tier rate limit exceeded' }, { status: 429 });
    }

    // 3. Payload Extraction
    const body = await req.json();
    const { term, researchContext } = body;

    if (!term) {
      return NextResponse.json({ error: 'Missing required field: term' }, { status: 400 });
    }

    // 4. Engine Execution
    // Uses system-wide cloud defaults for external API requests to ensure stability.
    const result = await aiStudyAssistant({
      term,
      researchContext: researchContext || [],
      model: systemConfig?.defaultModel || 'googleai/gemini-2.5-flash',
      apiKey: systemConfig?.geminiApiKey || undefined
    });

    // 5. Usage Analytics Update
    // Increments usage count to enforce rate limiting on subsequent calls.
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
    console.error('API Research Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error during research processing' 
    }, { status: 500 });
  }
}
