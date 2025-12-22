"use client";

import { useState } from "react";
import { Upload, FileCode, Download, ChevronRight, Loader2, Folder, FileText, Clipboard, FileJson } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface GeneratedFile {
  name: string;
  content: string;
  language: string;
}

export default function Home() {
  // Input States
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState<string>("");

  // Output States
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [zipDownload, setZipDownload] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleConvert = async () => {
    // Validation
    if (inputMode === 'upload' && !file) return;
    if (inputMode === 'paste' && !jsonText.trim()) return;

    setLoading(true);
    setFiles([]);
    setSelectedFile(null);
    setZipDownload(null);

    const formData = new FormData();

    // Append data based on active mode
    if (inputMode === 'upload' && file) {
      formData.append("file", file);
    } else if (inputMode === 'paste') {
      formData.append("text", jsonText);
    }

    try {
      const res = await fetch("http://localhost:8080/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Conversion failed");

      const data = await res.json();
      setFiles(data.files);
      if (data.files.length > 0) setSelectedFile(data.files[0]);
      setZipDownload(data.zip_base64);
    } catch (error) {
      console.error(error);
      alert("Error converting file. Check backend console.");
    } finally {
      setLoading(false);
    }
  };

  const downloadZip = () => {
    if (!zipDownload) return;
    const link = document.createElement("a");
    link.href = `data:application/zip;base64,${zipDownload}`;
    link.download = "UE5_Generated_Source.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 flex flex-col items-center">
      <section className="w-full max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            UE5 Blueprint to C++ Converter
          </h1>
          <p className="text-gray-400">Powered by Gemini AI</p>
        </header>

        {/* Input Section */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">

          {/* Tabs */}
          <section className="flex gap-4 mb-4 border-b border-gray-800 pb-2">
            <button
              onClick={() => setInputMode('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${inputMode === 'upload' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Upload size={18} /> Upload File
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${inputMode === 'paste' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Clipboard size={18} /> Paste JSON
            </button>
          </section>

          <section className="flex items-start justify-between gap-6">
            <section className="flex-1">
              {inputMode === 'upload' ? (
                // Upload UI
                <section className="relative w-full">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2 bg-gray-950/50 hover:bg-gray-800 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl p-10 transition h-40"
                  >
                    <FileJson size={32} className="text-gray-400" />
                    <article className="text-gray-300 font-medium">
                      {file ? file.name : "Click to select Blueprint JSON"}
                    </article>
                    {file && <article className="text-xs text-green-400">Ready to upload</article>}
                  </label>
                </section>
              ) : (
                // Paste UI
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Paste your Blueprint JSON content here..."
                  className="w-full h-40 bg-gray-950/50 border border-gray-700 rounded-xl p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                />
              )}
            </section>

            {/* Convert Button */}
            <section className="h-40 flex items-end">
              <button
                onClick={handleConvert}
                disabled={loading || (inputMode === 'upload' && !file) || (inputMode === 'paste' && !jsonText)}
                className={`h-full flex flex-col items-center justify-center px-8 rounded-xl font-bold transition border border-transparent ${loading || (inputMode === 'upload' && !file) || (inputMode === 'paste' && !jsonText)
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600 text-white shadow-lg shadow-blue-900/20"
                  }`}
              >
                {loading ? <Loader2 className="animate-spin mb-2" size={24} /> : <FileCode className="mb-2" size={24} />}
                {loading ? "Translating..." : "Convert"}
              </button>
            </section>
          </section>
        </section>

        {/* Results Section */}
        {files.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
            {/* Sidebar: File Explorer */}
            <section className="md:col-span-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
              <section className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                <article className="font-semibold text-gray-300">Explorer</article>
                <button
                  onClick={downloadZip}
                  className="text-xs flex items-center gap-1 bg-green-900/30 text-green-400 px-2 py-1 rounded hover:bg-green-900/50 transition"
                >
                  <Download size={14} /> ZIP
                </button>
              </section>
              <section className="p-2 overflow-y-auto flex-1">
                <section className="pl-2">
                  <section className="flex items-center gap-2 text-gray-400 mb-1 text-sm">
                    <Folder size={14} className="text-yellow-500" /> Source
                  </section>
                  <section className="pl-4 border-l border-gray-800 ml-1.5">
                    <section className="mb-2">
                      <section className="flex items-center gap-2 text-gray-400 mb-1 text-sm">
                        <Folder size={14} className="text-blue-400" /> Public
                      </section>
                      {files.filter(f => f.name.endsWith('.h')).map(f => (
                        <section
                          key={f.name}
                          onClick={() => setSelectedFile(f)}
                          className={`pl-4 py-1 text-sm cursor-pointer flex items-center gap-2 rounded ${selectedFile?.name === f.name ? "bg-blue-900/30 text-blue-300" : "text-gray-400 hover:text-white"}`}
                        >
                          <FileText size={12} /> {f.name}
                        </section>
                      ))}
                    </section>
                    <section>
                      <section className="flex items-center gap-2 text-gray-400 mb-1 text-sm">
                        <Folder size={14} className="text-blue-400" /> Private
                      </section>
                      {files.filter(f => f.name.endsWith('.cpp')).map(f => (
                        <section
                          key={f.name}
                          onClick={() => setSelectedFile(f)}
                          className={`pl-4 py-1 text-sm cursor-pointer flex items-center gap-2 rounded ${selectedFile?.name === f.name ? "bg-blue-900/30 text-blue-300" : "text-gray-400 hover:text-white"}`}
                        >
                          <FileText size={12} /> {f.name}
                        </section>
                      ))}
                    </section>
                  </section>
                </section>
              </section>
            </section>

            {/* Main: Code Viewer */}
            <section className="md:col-span-3 bg-[#1e1e1e] border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">
              <section className="bg-[#252526] px-4 py-2 border-b border-gray-800 text-sm text-gray-300 flex items-center gap-2">
                <FileCode size={14} className="text-blue-400" />
                {selectedFile ? selectedFile.name : "Select a file"}
              </section>
              <section className="flex-1 overflow-auto">
                {selectedFile ? (
                  <SyntaxHighlighter
                    language="cpp"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
                    showLineNumbers={true}
                  >
                    {selectedFile.content}
                  </SyntaxHighlighter>
                ) : (
                  <section className="h-full flex flex-col items-center justify-center text-gray-600">
                    <ChevronRight size={48} />
                    <p>Select a file to view code</p>
                  </section>
                )}
              </section>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}