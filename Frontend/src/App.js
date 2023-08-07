import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/theme-monokai';

function App() {
  const [data, setData] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const editorRef = useRef(null); // Ref to access the Ace Editor instance
  const lastSavedText = useRef(null); // Ref to store the last saved text in the editor

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/get_all_data');
      setData(response.data);
    } catch (error) {
      console.error('Error while fetching data:', error);
    }
  };

  const handleButtonClick = (block) => {
    setSelectedBlock(block);
  };

  const handleEditorChange = (newValue) => {
    lastSavedText.current = newValue; // Update the lastSavedText ref with the current editor value
  };

  const saveChanges = async () => {
    try {
      if (selectedBlock && lastSavedText.current !== selectedBlock.code_text) {
        // Update the server only if the editor content has changed
        await axios.put('http://127.0.0.1:5000/update_code_text', {
          block_id: selectedBlock.block_id,
          code_text: lastSavedText.current,
        });

        // Update the local state with the new code_text value
        setSelectedBlock((prevBlock) => ({ ...prevBlock, code_text: lastSavedText.current }));
      }
    } catch (error) {
      console.error('Error while updating data:', error);
    }
  };

  useEffect(() => {
    // Use a timer to periodically save changes to the server (every 2 seconds)
    const timerId = setInterval(saveChanges, 2000);

    // Cleanup the timer on component unmount
    return () => clearInterval(timerId);
  }, [selectedBlock]);

  useEffect(() => {
    // When selectedBlock changes, update the editor's value
    if (selectedBlock && editorRef.current) {
      // Save the current cursor position
      const cursorPos = editorRef.current.editor.getCursorPosition();

      // Update the editor's value
      editorRef.current.editor.setValue(selectedBlock.code_text, -1);

      // Restore the cursor position
      editorRef.current.editor.moveCursorToPosition(cursorPos);

      lastSavedText.current = selectedBlock.code_text;
    }
  }, [selectedBlock]);

  const handleReturnToLobby = () => {
    saveChanges(); // Save changes before refreshing the page
    window.location.reload(); // Refresh the page to return to the lobby
  };

  return (
    <div>
      {selectedBlock ? (
        <div>
          <h2>{selectedBlock.block_Name}</h2>
          <AceEditor
            ref={editorRef}
            mode="text"
            theme="monokai"
            value={selectedBlock.code_text}
            onChange={handleEditorChange}
            height="400px"
            width="100%"
          />
          <button onClick={handleReturnToLobby}>Return to Lobby</button>
        </div>
      ) : (
        <div>
          <h2>Choose code block:</h2>
          {data.map((block) => (
            <button key={block.block_id} onClick={() => handleButtonClick(block)}>
              {block.block_Name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
