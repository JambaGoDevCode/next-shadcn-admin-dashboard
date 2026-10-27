"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { TournamentOpsAdmin, type TournamentOpsSection } from "./tournament-ops-admin";

interface TournamentOperationsSwitcherProps {
  items: { section: TournamentOpsSection; label: string }[];
}

export function TournamentOperationsSwitcher({ items }: TournamentOperationsSwitcherProps) {
  const [activeSection, setActiveSection] = useState(items[0].section);

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Secções de operação do torneio</legend>
        {items.map((item) => (
          <Button
            aria-pressed={activeSection === item.section}
            key={item.section}
            onClick={() => setActiveSection(item.section)}
            size="sm"
            variant={activeSection === item.section ? "default" : "outline"}
          >
            {item.label}
          </Button>
        ))}
      </fieldset>
      <TournamentOpsAdmin key={activeSection} section={activeSection} />
    </div>
  );
}
