import { useState, useEffect, useRef } from 'react';

export default function useGoogleSignIn(buttonText = 'signin_with', selectedRole = 'aluno') {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButtonRef = useRef(null);

  const initializeGoogleSignIn = (handleResponse) => {
    if (!window.google?.accounts) return;

    window.google.accounts.id.initialize({
      client_id: "133837215411-f108mo4flmbqmtpofs2k1876kkrnl6tg.apps.googleusercontent.com",
      // Passamos a role para o callback envolto em uma função
      callback: (response) => handleResponse(response, selectedRole),
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.renderButton(
      googleButtonRef.current,
      {
        theme: 'outline',
        size: 'large',
        text: buttonText,
        width: '360',
        logo_alignment: 'left'
      }
    );
    setGoogleLoaded(true);
  };

  useEffect(() => {
    const loadGoogleScript = (callback) => {
      if (window.google) {
        initializeGoogleSignIn(callback);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(() => initializeGoogleSignIn(callback), 500);
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
        window.google?.accounts?.id?.cancel();
      };
    };

    return loadGoogleScript;
  }, []);

  return { googleButtonRef, googleLoaded };
}