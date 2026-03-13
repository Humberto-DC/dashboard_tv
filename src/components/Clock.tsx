"use client";

import React, { useEffect, useState } from "react";

export default function Clock() {
    // Iniciamos com null para que o servidor e o primeiro render do cliente sejam idênticos
    const [time, setTime] = useState<string | null>(null);

    useEffect(() => {
        const tick = () => {
            setTime(new Date().toLocaleTimeString("pt-BR"));
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <span className="font-mono text-slate-500" suppressHydrationWarning>
            {time ?? "--:--:--"}
        </span>
    );
}
