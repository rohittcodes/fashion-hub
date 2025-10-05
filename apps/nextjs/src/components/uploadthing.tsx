"use client";

import { UploadButton, UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "~/lib/uploadthing";

interface ImageUploadButtonProps {
  onUploadComplete?: (url: string) => void;
}

export function ImageUploadButton({ onUploadComplete }: ImageUploadButtonProps) {
  return (
    <UploadButton<OurFileRouter, "imageUploader">
      endpoint="imageUploader"
      onClientUploadComplete={(res) => {
        // Do something with the response
        console.log("Files: ", res);
        if (res[0]?.url && onUploadComplete) {
          onUploadComplete(res[0].url);
        }
        alert("Upload Completed");
      }}
      onUploadError={(error: Error) => {
        // Do something with the error.
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}

export function ImageUploadDropzone() {
  return (
    <UploadDropzone<OurFileRouter, "imageUploader">
      endpoint="imageUploader"
      onClientUploadComplete={(res) => {
        // Do something with the response
        console.log("Files: ", res);
        alert("Upload Completed");
      }}
      onUploadError={(error: Error) => {
        // Do something with the error.
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}

export function UploadThingProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}
