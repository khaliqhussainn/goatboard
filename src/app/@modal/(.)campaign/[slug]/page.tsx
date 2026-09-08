import { CampaignModal } from "@/components/campaign/campaign-modal";
import { CampaignDetail } from "@/components/campaign/campaign-detail";

export default async function InterceptedCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <CampaignModal>
      <CampaignDetail slug={slug} compact />
    </CampaignModal>
  );
}
