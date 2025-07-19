/* eslint-disable @typescript-eslint/no-empty-function */
import {
  BrowserMultiFormatReader,
  type DecodeHintType,
  type Result,
} from "@zxing/library";
import { useEffect, useMemo, useRef } from "react";

interface ZxingOptions {
  hints?: Map<DecodeHintType, unknown>;
  constraints?: MediaStreamConstraints;
  timeBetweenDecodingAttempts?: number;
  onResult?: (result: Result) => void;
  onError?: (error: Error) => void;
}

export const useZxing = ({
  hints,
  constraints = {
    audio: false,
    video: { facingMode: "environment" },
  },
  timeBetweenDecodingAttempts = 300,
  onResult = () => {},
  onError = () => {},
}: ZxingOptions = {}) => {
  const ref = useRef<HTMLVideoElement>(null);

  const reader = useMemo(() => {
    const instance = new BrowserMultiFormatReader(hints);
    instance.timeBetweenDecodingAttempts = timeBetweenDecodingAttempts;
    return instance;
  }, [hints, timeBetweenDecodingAttempts]);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    const tryDecode = () => {
      if (cancelled) return;
      try {
        reader.decodeFromConstraints(
          constraints,
          ref.current!,
          (result, error) => {
            if (result) onResult(result);
            // Only call onError for real errors, not 'No MultiFormat Readers...' (ZXing's not-found error)
            if (
              error &&
              error.message !==
                "No MultiFormat Readers were able to detect the code."
            ) {
              onError(error);
            }
          }
        );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (
          e?.message?.includes("getImageData") ||
          e?.name === "IndexSizeError"
        ) {
          setTimeout(tryDecode, 100);
        } else {
          onError(e);
        }
      }
    };
    tryDecode();
    return () => {
      cancelled = true;
      reader.reset();
    };
  }, [ref, reader, constraints, onResult, onError]);

  return { ref };
};
