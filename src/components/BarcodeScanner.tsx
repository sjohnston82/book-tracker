"use client";
import { useCallback, useState } from "react";
import { useZxing } from "@/hooks/useZxing";
import { Result } from "@zxing/library";

export default function BarcodeScanner({
  onResult,
}: {
  onResult: (isbn: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleResult = useCallback(
    (result: Result) => {
      const isbn = result.getText();
      onResult(isbn);
    },
    [onResult]
  );

  const handleError = useCallback((err: Error) => {
    console.error(err);
    setError("Unable to access or use the camera.");
  }, []);

  const { ref } = useZxing({
    onResult: handleResult,
    onError: handleError,
  });

  return (
    <div className="flex flex-col items-center">
      <video ref={ref} className="w-full max-w-sm rounded shadow" />
      {error && <p className="text-red-600 text-sm mt-2">⚠️ {error}</p>}
      <p className="text-sm text-gray-600 mt-2">
        Tip: Use the back camera and hold steady in good light.
      </p>
    </div>
  );
}
