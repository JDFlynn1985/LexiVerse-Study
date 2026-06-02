
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { logErrorToFirestore } from '@/lib/error-logging';

export function FirebaseErrorListener() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // 1. Alert the researcher
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: `Your academic profile does not grant permission to ${error.context.operation} at ${error.context.path}.`,
      });

      // 2. Persist log for administrative review
      if (db) {
        logErrorToFirestore(db, error, {
          type: 'firebase-permission',
          userId: user?.uid,
          metadata: error.context
        });
      }

      // 3. Let development overlay pick it up if in dev mode
      throw error;
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast, db, user?.uid]);

  return null;
}
