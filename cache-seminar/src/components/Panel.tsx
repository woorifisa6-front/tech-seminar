import React from "react";

export function Panel(props: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
      }}
    >
      <h3 style={{ marginTop: 0 }}>{props.title}</h3>
      {props.children}
    </section>
  );
}
