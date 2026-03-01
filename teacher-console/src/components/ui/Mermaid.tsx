"use client";
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export function Mermaid({ chart, id }: { chart: string; id: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });

        const renderChart = async () => {
            try {
                if (ref.current && chart) {
                    let cleanChart = chart.trim()
                    if (cleanChart.startsWith('```mermaid')) {
                        cleanChart = cleanChart.replace(/^```mermaid\n?/i, '')
                        cleanChart = cleanChart.replace(/\n?```$/i, '')
                    } else if (cleanChart.startsWith('```')) {
                        cleanChart = cleanChart.replace(/^```\n?/i, '')
                        cleanChart = cleanChart.replace(/\n?```$/i, '')
                    }
                    cleanChart = cleanChart.trim()

                    const uniqueId = `mermaid-${id.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 9)}`;
                    const { svg } = await mermaid.render(uniqueId, cleanChart);
                    ref.current.innerHTML = svg;
                    setHasError(false);
                }
            } catch (e) {
                console.error("Mermaid parsing error", e);
                setHasError(true);
            }
        };

        renderChart();
    }, [chart, id]);

    if (hasError) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 font-mono text-sm rounded-lg flex flex-col items-center justify-center my-4 text-center">
                <span>Failed to render diagram.</span>
                <pre className="text-xs mt-2 overflow-x-auto max-w-full text-red-800 bg-red-100 p-2 rounded">{chart}</pre>
            </div>
        );
    }

    return (
        <div className="my-6 flex justify-center w-full overflow-x-auto">
            <div ref={ref} className="mermaid-diagram max-w-full" />
        </div>
    );
}
