import { TournamentOperationsSwitcher } from "../_components/tournament-operations-switcher";

export default function Page() {
  return (
    <TournamentOperationsSwitcher
      items={[
        { section: "standings", label: "Classificações" },
        { section: "fixtures", label: "Resultados e histórico" },
      ]}
    />
  );
}
