import { useEffect, useState, useCallback } from 'react';

const useKonamiCode = (secretWord) => {
  const [success, setSuccess] = useState(false);
  const [input, setInput] = useState('');

  const handleKeyDown = useCallback(
    (e) => {
      // Ignore keypresses if the user is typing in an input or textarea
      if (
        e.target.tagName.toLowerCase() === 'input' ||
        e.target.tagName.toLowerCase() === 'textarea' ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Enter') {
        if (input.toLowerCase() === secretWord.toLowerCase()) {
          setSuccess(true);
          // Auto-reset success after 30 seconds
          setTimeout(() => {
            setSuccess(false);
          }, 30000);
        }
        setInput(''); // Reset on enter
      } else if (e.key.length === 1) { // Só captura letras/espaços
        setInput((prev) => (prev + e.key).slice(-secretWord.length));
      }
    },
    [input, secretWord]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return success;
};

export default useKonamiCode;
