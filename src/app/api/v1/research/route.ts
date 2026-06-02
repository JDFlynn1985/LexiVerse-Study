import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { aiStudyAssistant } from '@/ai/flows/ai-study-assistant';
import { sanitizeHtml } from '@/lib/sanitization';

/**
 * @swagger
 * /api/v1/research:
 *   post:
 *     summary: Execute a scholarly research query
 *     description: Leverages the LexiVerse AI engine and local research papers to synthesize an academic report. Access is governed by tiered rate limits and restricted to age-verified scholars (Clause 1.1).
 *     tags:
 *       - Research
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - term
 *             properties:
 *               term:
 *                 type: string
 *                 example: "Genesis 1:1"
 *                 description: The scripture reference or scholarly term to research.
 *               researchContext:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional excerpts from research papers to be used as RAG context.
 *     responses:
 *       200:
 *         description: Research successfully synthesized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ResearchOutput'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     tier:
 *                       type: string
 *                     remaining:
 *                       type: number
 *       401:
 *         description: Missing or invalid Authorization header.
 *       403:
 *         description: API Key is invalid or has been revoked by administration.
 *       429:
 *         description: Tier rate limit exceeded for the current 24-hour period.
 */

export async function POST(req: NextRequest) {
  const { firestore } = initializeFirebase();
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const apiKeyString = authHeader.split(' ')[1];

  try {
    const keysRef = collection(firestore, 'api_keys');
    const q = query(keysRef, where('key', '==', apiKeyString), where('revoked', '==', false));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 403 });
    }

    const keyDoc = querySnapshot.docs[0];
    const keyData = keyDoc.data();

    const configSnap = await getDoc(doc(firestore, 'system', 'config'));
    const systemConfig = configSnap.data();
    const tiers = systemConfig?.apiTiers || [];
    const userTier = tiers.find((t: any) => t.name === keyData.tier);
    const dailyLimit = userTier?.requestsPerDay || 10; 
    
    if (keyData.usageCount >= dailyLimit) {
      return NextResponse.json({ error: 'Tier rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { term, researchContext } = body;

    if (!term) {
      return NextResponse.json({ error: 'Missing required field: term' }, { status: 400 });
    }

    const sanitizedTerm = sanitizeHtml(term);
    const sanitizedContext = Array.isArray(researchContext) 
      ? researchContext.map(ctx => sanitizeHtml(ctx))
      : [];

    const result = await aiStudyAssistant({
      term: sanitizedTerm,
      researchContext: sanitizedContext,
      model: systemConfig?.defaultModel || 'googleai/gemini-2.5-flash',
      apiKey: systemConfig?.geminiApiKey || undefined
    });

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
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
