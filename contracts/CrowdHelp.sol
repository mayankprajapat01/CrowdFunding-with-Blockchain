// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// knock execute ladder favorite mutual nest boil feed lounge unaware torch wide
contract CrowdHelp {
    enum State { ACTIVE, SUCCESS, EXPIRED, ABORTED }

    struct Contribution {
        address payable contributor;
        uint256 amount;
    }

    struct Campaign {
        address payable creator;
        uint256 minimumContribution;
        uint256 deadline;
        uint256 targetContribution;
        uint256 reachedTargetAt;
        uint256 raisedAmount;
        uint256 noOfContributors;
        string projectTitle;
        string projectDes;
        string bannerUrl;
        State state;
        Contribution[] contributions;
    }

    Campaign[] private campaigns;

    event CampaignStarted(
        uint256 indexed campaignId,
        address creator,
        uint256 minContribution,
        uint256 projectDeadline,
        uint256 goalAmount,
        string title,
        string desc
    );

    event FundingReceived(
        uint256 indexed campaignId,
        address contributor,
        uint256 amount,
        uint256 currentTotal
    );

    event AmountCredited(uint256 indexed campaignId, address contributor, uint256 amountTotal);
    event AmountRefunded(uint256 indexed campaignId, uint256 noOfContributors, uint256 amountTotal);

    modifier isCreator(uint256 _campaignId) {
        require(msg.sender == campaigns[_campaignId].creator, "Unauthorized operation!");
        _;
    }

    modifier canContribute(uint256 _campaignId) {
        require(
            campaigns[_campaignId].state == State.ACTIVE || campaigns[_campaignId].state == State.SUCCESS,
            "Invalid state"
        );
        require(block.timestamp < campaigns[_campaignId].deadline, "Deadline passed!");
        _;
    }

    function createCampaign(
        string memory projectTitle,
        string memory projectDesc,
        uint256 minimumContribution,
        uint256 targetContribution,
        uint256 deadline,
        string memory bannerUrl
    ) public {
        Campaign storage newCampaign = campaigns.push();
        newCampaign.creator = payable(msg.sender);
        newCampaign.minimumContribution = minimumContribution;
        newCampaign.deadline = deadline;
        newCampaign.targetContribution = targetContribution;
        newCampaign.projectTitle = projectTitle;
        newCampaign.projectDes = projectDesc;
        newCampaign.bannerUrl = bannerUrl;
        newCampaign.state = State.ACTIVE;

        emit CampaignStarted(
            campaigns.length - 1,
            msg.sender,
            minimumContribution,
            deadline,
            targetContribution,
            projectTitle,
            projectDesc
        );
    }

    function contribute(uint256 _campaignId) public payable canContribute(_campaignId) {
        require(msg.value >= campaigns[_campaignId].minimumContribution, "Amount too low!");
        
        campaigns[_campaignId].contributions.push(Contribution(payable(msg.sender), msg.value));
        campaigns[_campaignId].raisedAmount += msg.value;
        campaigns[_campaignId].noOfContributors++;

        emit FundingReceived(_campaignId, msg.sender, msg.value, campaigns[_campaignId].raisedAmount);
        checkFundingGoalReached(_campaignId);
    }

    function checkFundingGoalReached(uint256 _campaignId) internal {
        if (campaigns[_campaignId].raisedAmount >= campaigns[_campaignId].targetContribution && block.timestamp < campaigns[_campaignId].deadline) {
            campaigns[_campaignId].state = State.SUCCESS;
            campaigns[_campaignId].reachedTargetAt = block.timestamp;
        }
    }

    function endCampaignAndCredit(uint256 _campaignId) public isCreator(_campaignId) {
        require(campaigns[_campaignId].state == State.SUCCESS, "Goal not reached.");
        require(block.timestamp < campaigns[_campaignId].deadline, "Deadline not reached.");

        campaigns[_campaignId].creator.transfer(campaigns[_campaignId].raisedAmount);
        campaigns[_campaignId].state = State.EXPIRED;

        emit AmountCredited(_campaignId, campaigns[_campaignId].creator, campaigns[_campaignId].raisedAmount);
    }

    function abortCampaignAndRefund(uint256 _campaignId) public isCreator(_campaignId) {
        require(block.timestamp < campaigns[_campaignId].deadline, "Deadline passed.");
        require(
            campaigns[_campaignId].state == State.ACTIVE || campaigns[_campaignId].state == State.SUCCESS,
            "Invalid state."
        );

        for (uint256 i = 0; i < campaigns[_campaignId].contributions.length; i++) {
            campaigns[_campaignId].contributions[i].contributor.transfer(
                campaigns[_campaignId].contributions[i].amount
            );
        }

        campaigns[_campaignId].state = State.ABORTED;
        emit AmountRefunded(_campaignId, campaigns[_campaignId].noOfContributors, campaigns[_campaignId].raisedAmount);
    }

    function getCampaignSummary(uint256 _campaignId) public view returns (
        address payable projectStarter,
        uint256 minContribution,
        uint256 projectDeadline,
        uint256 goalAmount,
        uint256 completedTime,
        uint256 currentAmount,
        string memory title,
        string memory desc,
        State currentState,
        uint256 balance,
        string memory imageUrl,
        uint256 numBackers
    ) {
        Campaign storage c = campaigns[_campaignId];
        return (
            c.creator,
            c.minimumContribution,
            c.deadline,
            c.targetContribution,
            c.reachedTargetAt,
            c.raisedAmount,
            c.projectTitle,
            c.projectDes,
            c.state,
            address(this).balance,
            c.bannerUrl,
            c.noOfContributors
        );
    }

    function returnDeployedCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }
}