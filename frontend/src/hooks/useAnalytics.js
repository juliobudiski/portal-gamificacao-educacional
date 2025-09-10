// frontend/src/hooks/useAnalytics.js
import { useEffect, useRef, useCallback } from "react";

// URL base da API (ajuste conforme seu setup)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/";

// --- Função auxiliar para enviar logs ---
async function sendLog(events, token) {
  try {
    const fullUrl = `${API_URL}/api/log/event`; // Cria a URL completa
    console.log("Enviando log para:", fullUrl);
    // A URL completa é construída aqui
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // JWT do usuário logado
      },
      body: JSON.stringify(
        Array.isArray(events) ? { events } : events
      ),
    });

    if (!res.ok) {
      console.error("Erro ao enviar log:", await res.json());
    }
  } catch (err) {
    console.error("Falha na requisição de log:", err);
  }
}

export default function useAnalytics(section, token, activityId) {
  const startTimeRef = useRef(null);
  const lastActiveRef = useRef(Date.now());
  const isActiveRef = useRef(true);

  // --- Função pública: logar eventos unitários ---
  const logEvent = useCallback((action, details = {}, sectionOverride = null) => {
    const event = {
      section: sectionOverride || section,
      action,
      details,
      activity_id: activityId
    };
    sendLog(event, token);
  }, [section, token, activityId]);

  // --- Timer: iniciar ---
  const startTimer = useCallback((sectionName = section) => {
    startTimeRef.current = Date.now();
    lastActiveRef.current = Date.now();
    isActiveRef.current = true;
    logEvent("view_start", { section: sectionName }, sectionName);
  }, [section, logEvent]);

  // --- Timer: parar e enviar duração ---
  const stopTimer = useCallback((sectionName = section) => {
    if (startTimeRef.current) {
      const now = Date.now();
      let duration = Math.floor((now - startTimeRef.current) / 1000);

      if (!isActiveRef.current || now - lastActiveRef.current > 30000) {
        duration -= Math.floor((now - lastActiveRef.current) / 1000);
      }

      if (duration > 0) {
        logEvent("view_duration", { section: sectionName, duration_seconds: duration }, sectionName);
      }

      startTimeRef.current = null;
    }
  }, [section, logEvent]);

  // --- Monitorar visibilidade da aba ---
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        isActiveRef.current = false;
      } else {
        isActiveRef.current = true;
        lastActiveRef.current = Date.now();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // --- Auto start/stop timer quando componente monta/desmonta ---
  useEffect(() => {
    startTimer(section);
    return () => stopTimer(section);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { logEvent, startTimer, stopTimer };
}