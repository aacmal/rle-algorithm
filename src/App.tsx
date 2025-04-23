import { useRef } from "react";
import "./App.css";
import { saveAs } from "file-saver";

function App() {
  // const [encodedText, setEncodedText] = useState("");
  const kompressRef = useRef<HTMLInputElement>(null);
  const dekompressRef = useRef<HTMLInputElement>(null);

  // Algoritma Run-Length Encoding
  const runLengthEncode = (input: string) => {
    if (!input) return "";
    let result = "";
    let count = 1;

    for (let i = 1; i <= input.length; i++) {
      if (input[i] === input[i - 1]) {
        count++;
      } else {
        result += input[i - 1] + count;
        count = 1;
      }
    }

    return result;
  };

  const runLengthDecode = (input: string) => {
    let result = "";
    for (let i = 0; i < input.length; i += 2) {
      const char = input[i];
      const count = parseInt(input[i + 1]);
      result += char.repeat(count);
    }
    return result;
  };

  const handleFileProcess = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "encode" | "decode"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result =
        mode === "encode" ? runLengthEncode(text) : runLengthDecode(text);
      showSaveDialog(result, mode);
    };
    reader.readAsText(file);
  };

  const showSaveDialog = (text: string, mode: "encode" | "decode") => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `rle_${mode}_output.txt`);
  };

  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="font-bold text-2xl">RLE Algorithm</h1>
      <div className="flex gap-3 mt-10">
        <input
          ref={kompressRef}
          type="file"
          accept=".txt"
          onChange={(e) => handleFileProcess(e, "encode")}
          className="hidden"
        />
        <button
          onClick={() => kompressRef.current?.click()}
          className="px-3 hover:cursor-pointer py-2 rounded-md bg-blue-500 font-black text-white"
        >
          Kompres
        </button>
        <input
          ref={dekompressRef}
          type="file"
          accept=".txt"
          onChange={(e) => handleFileProcess(e, "decode")}
          className="hidden"
        />
        <button
          onClick={() => dekompressRef.current?.click()}
          className="px-3 hover:cursor-pointer py-2 rounded-md bg-green-500 font-black text-white"
        >
          Dekompres
        </button>
      </div>
    </main>
  );
}

export default App;
