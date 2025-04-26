import type React from "react";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileIcon, DownloadIcon } from "lucide-react";

export default function CompressionApp() {
  return (
    <main className="min-h-screen flex flex-col justify-between font-monserrat">
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Aplikasi Kompresi Run Length Encoding (RLE)
        </h1>

        <Tabs defaultValue="compress" className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="compress">Kompres</TabsTrigger>
            <TabsTrigger value="decompress">Dekompres</TabsTrigger>
          </TabsList>

          <TabsContent value="compress">
            <CompressionTab />
          </TabsContent>

          <TabsContent value="decompress">
            <DecompressionTab />
          </TabsContent>
        </Tabs>
      </div>
      <footer className="p-3">
        <Card>
          <CardContent className="text-center font-medium">
            <p>Copyright © 2025 Acmal. All rights reserved.</p>
          </CardContent>
        </Card>
      </footer>
    </main>
  );
}

function CompressionTab() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [compressedContent, setCompressedContent] = useState<string>("");
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [isText, setIsText] = useState<boolean>(true);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    setOriginalSize(file.size);

    try {
      // Try to read as text
      const text = await file.text();
      setOriginalContent(text);
      setIsText(true);

      // Compress the content
      const compressed = compressRLE(text);
      setCompressedContent(compressed);

      // Create a blob from the compressed content
      const blob = new Blob([compressed], { type: "text/plain" });
      setCompressedBlob(blob);
      setCompressedSize(blob.size);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsText(false);
      setOriginalContent("File tidak dapat ditampilkan (bukan teks)");
      setCompressedContent("");
    }
  };

  const compressRLE = (input: string): string => {
    if (!input) return "";

    let result = "";
    let count = 1;
    let current = input[0];

    for (let i = 1; i < input.length; i++) {
      if (input[i] === current) {
        count++;
      } else {
        result += count + current;
        current = input[i];
        count = 1;
      }
    }

    result += count + current;
    return result;
  };

  const downloadCompressed = () => {
    if (!compressedBlob) return;

    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalFile ? `${originalFile.name}.rle` : "compressed.rle";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kompres File</CardTitle>
        <CardDescription>
          Upload file untuk dikompresi menggunakan algoritma Run Length Encoding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Pilih File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="flex-1 bg-accent"
              />
              <Button variant="outline" size="icon" disabled={!originalFile}>
                <FileIcon className="h-4 w-4" />
                <span className="sr-only">File info</span>
              </Button>
            </div>
          </div>

          {originalFile && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">File Asli</h3>
                  <span className="text-sm text-muted-foreground">
                    {(originalSize / 1024).toFixed(2)} KB
                  </span>
                </div>
                {isText && (
                  <div className="border rounded-md p-3 h-60 overflow-auto bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap">
                      {originalContent}
                    </pre>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">File Terkompresi</h3>
                  <span className="text-sm text-muted-foreground">
                    {(compressedSize / 1024).toFixed(2)} KB
                  </span>
                </div>
                {isText && (
                  <div className="border rounded-md p-3 h-60 overflow-auto bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap">
                      {compressedContent}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {originalFile && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Rasio Kompresi:</p>
                  <p className="text-sm text-muted-foreground">
                    {originalSize > 0
                      ? `${(
                          100 -
                          (compressedSize / originalSize) * 100
                        ).toFixed(
                          2
                        )}% (${originalSize} → ${compressedSize} bytes)`
                      : "N/A"}
                  </p>
                </div>
                <Button onClick={downloadCompressed} disabled={!compressedBlob}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Simpan File
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DecompressionTab() {
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [decompressedSize, setDecompressedSize] = useState<number>(0);
  const [compressedContent, setCompressedContent] = useState<string>("");
  const [decompressedContent, setDecompressedContent] = useState<string>("");
  const [decompressedBlob, setDecompressedBlob] = useState<Blob | null>(null);
  const [isText, setIsText] = useState<boolean>(true);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressedFile(file);
    setCompressedSize(file.size);

    try {
      // Try to read as text
      const text = await file.text();
      setCompressedContent(text);
      setIsText(true);

      // Decompress the content
      const decompressed = decompressRLE(text);
      setDecompressedContent(decompressed);

      // Create a blob from the decompressed content
      const blob = new Blob([decompressed], { type: "text/plain" });
      setDecompressedBlob(blob);
      setDecompressedSize(blob.size);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsText(false);
      setCompressedContent("File tidak dapat ditampilkan (bukan teks)");
      setDecompressedContent("");
    }
  };

  const decompressRLE = (input: string): string => {
    if (!input) return "";

    let result = "";
    let i = 0;

    while (i < input.length) {
      let countStr = "";
      while (i < input.length && /\d/.test(input[i])) {
        countStr += input[i];
        i++;
      }

      const count = Number.parseInt(countStr);

      if (i < input.length && !isNaN(count)) {
        const char = input[i];
        result += char.repeat(count);
        i++;
      }
    }

    return result;
  };

  const downloadDecompressed = () => {
    if (!decompressedBlob) return;

    const url = URL.createObjectURL(decompressedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = compressedFile
      ? compressedFile.name.replace(".rle", "")
      : "decompressed.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dekompres File</CardTitle>
        <CardDescription>
          Upload file terkompresi untuk dikembalikan ke bentuk aslinya
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file-upload-decompress">
              Upload File Terkompresi
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload-decompress"
                type="file"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button variant="outline" size="icon" disabled={!compressedFile}>
                <FileIcon className="h-4 w-4" />
                <span className="sr-only">File info</span>
              </Button>
            </div>
          </div>

          {compressedFile && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">File Terkompresi</h3>
                  <span className="text-sm text-muted-foreground">
                    {(compressedSize / 1024).toFixed(2)} KB
                  </span>
                </div>
                {isText && (
                  <div className="border rounded-md p-3 h-60 overflow-auto bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap">
                      {compressedContent}
                    </pre>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">File Hasil Dekompres</h3>
                  <span className="text-sm text-muted-foreground">
                    {(decompressedSize / 1024).toFixed(2)} KB
                  </span>
                </div>
                {isText && (
                  <div className="border rounded-md p-3 h-60 overflow-auto bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap">
                      {decompressedContent}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {compressedFile && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Rasio Ekspansi:</p>
                  <p className="text-sm text-muted-foreground">
                    {compressedSize > 0
                      ? `${(
                          (decompressedSize / compressedSize) * 100 -
                          100
                        ).toFixed(
                          2
                        )}% (${compressedSize} → ${decompressedSize} bytes)`
                      : "N/A"}
                  </p>
                </div>
                <Button
                  onClick={downloadDecompressed}
                  disabled={!decompressedBlob}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Simpan Hasil Dekompres
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
