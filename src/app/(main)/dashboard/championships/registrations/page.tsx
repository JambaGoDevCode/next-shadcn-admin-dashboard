import { TournamentOperationsSwitcher } from "../_components/tournament-operations-switcher";

export default function Page() {
  return (
    <TournamentOperationsSwitcher
      items={[
        { section: "registrations", label: "Inscrições" },
        { section: "payments", label: "Pagamentos" },
      ]}
    />
  );
}
