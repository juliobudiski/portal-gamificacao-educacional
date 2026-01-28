import { useState, useEffect, useRef } from 'react';

export default function useGoogleSignIn(handleResponse, buttonText = 'signin_with') {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButtonRef = useRef(null);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (!window.google?.accounts) return;

      window.google.accounts.id.initialize({
        client_id: "133837215411-f108mo4flmbqmtpofs2k1876kkrnl6tg.apps.googleusercontent.com",
        callback: handleResponse, // O componente pai (RegisterPage) tratará a resposta
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleButtonRef.current) {
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
      }
      setGoogleLoaded(true);
    };

    if (window.google) {
      initializeGoogleSignIn();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    }
  }, [handleResponse, buttonText]); // Recria se o callback mudar

  return { googleButtonRef, googleLoaded };
}