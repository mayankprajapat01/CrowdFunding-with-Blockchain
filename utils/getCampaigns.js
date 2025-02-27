import crowdHelp from "./contract/crowdHelp";
import web3 from "./web3";

// Fetch the deployed campaigns
export const getDeployedCampaigns = async () => {
  try {
    console.log("Fetching deployed campaigns...");
    const campaignsList = await crowdHelp.methods.returnDeployedCampaigns().call();
    console.log("campaignsList:", campaignsList);
    return campaignsList.map((_, index) => index); // Since campaigns are stored as an array
  } catch (err) {
    console.error("[ERROR] Failed to fetch deployed campaigns:", err);
    return [];
  }
};

// Fetch summary for all campaigns
export const getCampaignsSummary = async (campaigns) => {
  console.log("Fetching campaign summaries for:", campaigns);
  try {
    const campaignsSummary = await Promise.all(
      campaigns.map((campaignId) =>
        crowdHelp.methods.getCampaignSummary(campaignId).call()
      )
    );

    const formattedSummaries = campaignsSummary.map((summary, idx) =>
      formatSummary(summary, idx) // Campaign IDs are now indices
    );

    console.log("Formatted campaign summaries:", formattedSummaries);
    return formattedSummaries;
  } catch (err) {
    console.error("[ERROR] Failed to fetch campaigns summary:", err);
    return [];
  }
};

// Fetch details for a single campaign
export const getCampaignDetails = async (campaignId) => {
  try {
    console.log("Fetching details for campaign:", campaignId);
    const summary = await crowdHelp.methods.getCampaignSummary(campaignId).call();
    const formattedSummary = formatSummary(summary, campaignId);
    console.log("Formatted campaign details:", formattedSummary);
    return formattedSummary;
  } catch (err) {
    console.error("[ERROR] Failed to fetch campaign details:", err);
    return null;
  }
};

// Helper function to format summary
function formatSummary(summary, campaignId) {
  return {
    id: campaignId,
    title: summary[6], // projectTitle
    description: summary[7], // projectDes
    ethRaised: web3.utils.fromWei(summary[5], "ether"), // raisedAmount
    ethFunded: web3.utils.fromWei(summary[3], "ether"), // targetContribution
    minContribAmount: web3.utils.fromWei(summary[1], "ether"), // minContribution
    createdBy: summary[0], // projectStarter
    bannerUrl: summary[10], // imageUrl
    deadline: parseInt(summary[2], 10), // projectDeadline
    campaignStatus: cvtIntStatusToEnum(summary[8]), // currentState
    backersCount: summary[11], // numBackers
  };
}

// Convert campaign status integer to readable enum
function cvtIntStatusToEnum(status) {
  switch (status.toString()) {
    case "0": return "ACTIVE";
    case "1": return "SUCCESS";
    case "2": return "EXPIRED";
    case "3": return "ABORTED";
    default: return "UNKNOWN";
  }
}

export const contributeToCampaign = async (campaignId, amount, account) => {
  try {
    console.log(`Contributing ${amount} ETH to campaign ${campaignId} from ${account}...`);
    await crowdHelp.methods.contribute(campaignId).send({
      from: account,
      value: web3.utils.toWei(amount.toString(), "ether"),
    });

    console.log("Contribution successful!");
    return true;
  } catch (err) {
    console.error("[ERROR] Contribution failed:", err);
    return false;
  }
};

export const abortCampaignAndRefund = async (campaignId, account) => {
  try {
    console.log(`Aborting campaign ${campaignId} and refunding contributors...`);
    await crowdHelp.methods.abortCampaignAndRefund(campaignId).send({
      from: account,
    });

    console.log("Campaign aborted, refunds processed!");
    return true;
  } catch (err) {
    console.error("[ERROR] Failed to abort campaign:", err);
    return false;
  }
};

export const endCampaignAndCredit = async (campaignId, account) => {
  try {
    console.log(`Ending campaign ${campaignId} and crediting funds to creator ${account}...`);
    await crowdHelp.methods.endCampaignAndCredit(campaignId).send({
      from: account,
    });

    console.log("Campaign ended successfully, funds credited!");
    return true;
  } catch (err) {
    console.error("[ERROR] Failed to end campaign and credit funds:", err);
    return false;
  }
};
