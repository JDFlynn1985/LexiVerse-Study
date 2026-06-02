
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { alignSynopticGospels } from '@/ai/flows/synoptic-aligner-flow';

/**
 * @swagger
 * /api/v1/synoptic:
 *   post:
 *     summary: Align Gospel narrative events
 *     description: Maps a specific biblical event across Matthew, Mark, Luke, and John traditions.
 *     tags:
 *       - Synoptics
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *             properties:
 *               event:
 *                 type: string
 *                 example: "The Transfiguration"
 *     responses:
 *       200:
 *         description: Synoptic alignment successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SynopticOutput'
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
    const body = await req.json();

    if (!body.event) return NextResponse.json({ error: 'Missing event' }, { status: 400 });

    const result = await alignSynopticGospels(body.event);

    await updateDoc(doc(firestore, 'api_keys', keyDoc.id), {
      usageCount: increment(1),
      lastUsedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
