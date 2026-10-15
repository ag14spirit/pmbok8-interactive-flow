import { getProcessRepository } from "@/lib/data";
import { FlowApp } from "@/components/flow/FlowApp";

export default async function Home() {
  const data = await getProcessRepository().getFlow();
  return <FlowApp data={data} />;
}
