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
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import useVersion from "./hooks/use-version";

// Define interfaces for Rust function returns
interface CompressionResult {
  original_size: number;
  compressed_size: number;
  compressed_content: string;
  compression_ratio: number;
}

interface DecompressionResult {
  compressed_size: number;
  decompressed_size: number;
  decompressed_content: string;
  expansion_ratio: number;
}

export default function CompressionApp() {
  const version = useVersion();

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
      <footer className="text-center">
        <p className="shadow mx-auto rounded-lg px-3 py-2 m-2 block w-fit">
          {version}
        </p>
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
  const [compressionRatio, setCompressionRatio] = useState<number>(0);
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

      // Call the Rust function for compression
      const result: CompressionResult = await invoke("compress_rle", {
        input: text,
      });

      setCompressedContent(result.compressed_content);
      setCompressedSize(result.compressed_size);
      setCompressionRatio(result.compression_ratio);
    } catch (error) {
      console.error("Error processing file:", error);
      setIsText(false);
      setOriginalContent("File tidak dapat ditampilkan (bukan teks)");
      setCompressedContent("");
    }
  };

  const downloadCompressed = async () => {
    if (!originalFile || !compressedContent) return;

    try {
      // Use Tauri's dialog to choose where to save
      const filePath = await save({
        defaultPath: `${originalFile.name}.rle`,
        filters: [{ name: "RLE Files", extensions: ["rle"] }],
      });

      if (filePath) {
        // Write the file
        await writeTextFile(filePath, compressedContent);
      }
    } catch (error) {
      console.error("Error saving file:", error);
    }
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
                      ? `${compressionRatio.toFixed(
                          2
                        )}% (${originalSize} → ${compressedSize} bytes)`
                      : "N/A"}
                  </p>
                </div>
                <Button
                  onClick={downloadCompressed}
                  disabled={!compressedContent}
                >
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
  const [expansionRatio, setExpansionRatio] = useState<number>(0);
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

      // Call the Rust function for decompression
      const result: DecompressionResult = await invoke("decompress_rle", {
        input: text,
      });

      setDecompressedContent(result.decompressed_content);
      setDecompressedSize(result.decompressed_size);
      setExpansionRatio(result.expansion_ratio);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsText(false);
      setCompressedContent("File tidak dapat ditampilkan (bukan teks)");
      setDecompressedContent("");
    }
  };

  const downloadDecompressed = async () => {
    if (!compressedFile || !decompressedContent) return;

    try {
      // Use Tauri's dialog to choose where to save
      const filePath = await save({
        defaultPath: compressedFile.name.replace(".rle", ".txt"),
        filters: [{ name: "Text Files", extensions: ["txt"] }],
      });

      if (filePath) {
        // Write the file
        await writeTextFile(filePath, decompressedContent);
      }
    } catch (error) {
      console.error("Error saving file:", error);
    }
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
                      ? `${expansionRatio.toFixed(
                          2
                        )}% (${compressedSize} → ${decompressedSize} bytes)`
                      : "N/A"}
                  </p>
                </div>
                <Button
                  onClick={downloadDecompressed}
                  disabled={!decompressedContent}
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
