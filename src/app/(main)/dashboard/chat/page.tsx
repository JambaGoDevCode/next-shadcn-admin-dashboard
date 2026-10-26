import { getChatDataAction } from "./_components/actions";
import { ChatDashboard } from "./_components/chat-dashboard";

export default async function Page() {
  const result = await getChatDataAction();
  return <ChatDashboard initialResult={result} />;
}
