import { TournamentOperationsSwitcher } from "../_components/tournament-operations-switcher";

export default function Page() {
  return (
    <TournamentOperationsSwitcher
      items={[
        { section: "fixtures", label: "Calendário e jogos" },
        { section: "stages", label: "Fases e progressão" },
      ]}
    />
  );
}
