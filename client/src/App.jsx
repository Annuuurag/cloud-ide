import { useCallback, useEffect, useState } from "react";
import "./App.css";

import Terminal from "./components/terminal";
import FileTree from "./components/tree";
import socket from "./socket";

//import AceEditor from "react-ace";

import ReactAce from "react-ace";
const AceEditor = ReactAce.default ?? ReactAce;

import * as ace from "ace-builds/src-noconflict/ace";
window.ace = ace;

//import ace from "ace-builds/src-noconflict/ace";
ace.config.set("useWorker", false);

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-xml";
import "ace-builds/src-noconflict/mode-ruby";
import "ace-builds/src-noconflict/mode-sass";
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/mode-mysql";
import "ace-builds/src-noconflict/mode-handlebars";
import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/mode-csharp";
import "ace-builds/src-noconflict/mode-coffee";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-html";

import { getFileMode } from "./utils/getFileMode";

//const BACKEND_URL = "http://3.110.135.150:9000";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


//ace.config.set("basePath", "/node_modules/ace-builds/src-noconflict");

console.log("AceEditor:", typeof AceEditor);
console.log("Terminal:", typeof Terminal);
console.log("FileTree:", typeof FileTree);

function App() {
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [code, setCode] = useState("");

  const isSaved = selectedFileContent === code;

  useEffect(() => {
    getFileTree();
  }, []);

  useEffect(() => {
    if (!isSaved && code) {
      const timer = setTimeout(() => {
        socket.emit("file:change", {
          path: selectedFile,
          content: code,
        });
      }, 5 * 1000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [code, selectedFile, isSaved]);

  useEffect(() => {
    setCode("");
  }, [selectedFile]);

  useEffect(() => {
    setCode(selectedFileContent);
  }, [selectedFileContent]);

  const getFileTree = async () => {
    const response = await fetch(`${BACKEND_URL}/files`);
    const result = await response.json();
    setFileTree(result.tree);
  };

  const getFileContents = useCallback(async () => {
    if (!selectedFile) return;
    const response = await fetch(
      `${BACKEND_URL}/files/content?path=${selectedFile}`
    );
    const result = await response.json();
    setSelectedFileContent(result.content);
  }, [selectedFile]);

  useEffect(() => {
    if (selectedFile) getFileContents();
  }, [getFileContents, selectedFile]);

  useEffect(() => {
    socket.on("file:refresh", getFileTree);
    return () => {
      socket.off("file:refresh", getFileTree);
    };
  }, []);

  return (
    <div className="playground-container">
      <div className="editor-container">
        <div className="files">
          <FileTree
            onSelect={(path) => {
              setSelectedFileContent("");
              setSelectedFile(path);
            }}
            tree={fileTree}
          />
        </div>
        <div className="editor">
          {selectedFile && (
            <p>
              {selectedFile.replaceAll("/", " > ")}{" "}
              {isSaved ? "Saved" : "Unsaved"}
            </p>
          )}

          <AceEditor
            width="100%"
            height="90%"
            theme="github"
            mode={getFileMode({ selectedFile })}
            value={code}
            onChange={(e) => setCode(e)}
            setOptions={{
              useWorker: false,
              enableLiveAutocompletion: true,
              enableBasicAutocompletion: true,
            }}
          />
        </div>
      </div>
      <div className="terminal-container">
        <Terminal />
      </div>
    </div>
  );
}

export default App;
