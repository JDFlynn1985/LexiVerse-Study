import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { getStrongsData } from '@/lib/lexicon-api';

/**
 * @swagger
 * /api/v1/lexicon:
 *   get:
 *     summary: Retrieve verified lexical data
 *     description: Fetches structured linguistic data for a given Strong's number from the LexiVerse registry. Grounded in verified concordance data.
 *     tags:
 *       - Linguistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: number
 *         required: true
 *         schema:
 *           type: string
 *         example: "G3056"
 *         description: The Strong's number to retrieve (e.g. G3056 for Logos).
 *     responses:
 *       200:
 *         description: Lexical data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LexiconOutput'
 *       404:
 *         description: Strong's number not found in the verified registry.
 */

export async function GET(req: NextRequest) {
  const { firestore } = initializeFirebase();
  const authHeader = req.headers.get('Authorization');
  const number = req.nextUrl.searchParams.get('number');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  if (!number) {
    return NextResponse.json({ error: 'Missing required query parameter: number' }, { status: 400 });
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

    const dailyLimit = 100; // Lexicon queries are lighter

    if (keyData.usageCount >= dailyLimit) {
      return NextResponse.json({ error: 'Tier rate limit exceeded' }, { status: 429 });
    }

    const data = await getStrongsData(number);
    if (!data) return NextResponse.json({ error: 'Number not found' }, { status: 404 });

    await updateDoc(doc(firestore, 'api_keys', keyDoc.id), {
      usageCount: increment(1),
      lastUsedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
