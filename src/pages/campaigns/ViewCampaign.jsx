import React, { useEffect } from "react";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { Box, Button, styled } from "@mui/material";
import { Container, Link, TextField, Typography } from "@mui/material";
import LinearProgress from "@mui/material/LinearProgress";
import Modal from "@mui/material/Modal";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Chip from "@mui/material/Chip";
import { LoadingButton } from "@mui/lab";

import NavBar from "../../components/NavBar";
import { useWallet } from "use-wallet";
import { useForm } from "react-hook-form";
import { abortCampaignAndRefund, contributeToCampaign, endCampaignAndCredit, getCampaignDetails } from "../../../utils/getCampaigns";
import crowdHelp from "../../../utils/contract/crowdHelp";
import web3 from "../../../utils/web3";

const StyledModal = styled(Modal)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

function ViewCampaign() {
  const campaignId = window.location.pathname.substring(10);

  const [responseMsg, setResponseMsg] = React.useState("");
  const [showResponse, setShowResponse] = React.useState(false);
  const [responseSeverity, setResponseSeverity] = React.useState("error");

  const [campaignData, setCampaignData] = React.useState({});
  const wallet = useWallet();

  const {
    handleSubmit: contributionHandleSubmit,
    register: contributionRegister,
    formState: contributionFormState,
  } = useForm({
    mode: "onChange",
  });

  const {
    handleSubmit: abortHandleSubmit,
    register: abortRegister,
    formState: abortFormState,
    reset: abortReset,
  } = useForm({
    mode: "onChange",
  });

  const {
    handleSubmit: withdrawHandleSubmit,
    register: withdrawRegister,
    formState: withdrawFormState,
  } = useForm({
    mode: "onChange",
  });

  const [isContributionSuccess, setIsContributionSuccess] =
    React.useState(false);
  const [contributionError, setContributionError] = React.useState("");
  const [abortingError, setAbortingError] = React.useState("");
  const [endAndWithdrawError, setEndAndWithdrawError] = React.useState("");

  const minAmountKey = "minContribAmount";
  const [showEndCampaignConfirmation, setShowEndCampaignConfirmation] =
    React.useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      await getCampaignDetails(campaignId).then((data) => {
        if (!ignore && data != undefined) setCampaignData(data);
      });
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, []);

  function LinearProgressWithLabel(props) {
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box sx={{ width: "100%", mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.value
          )}%`}</Typography>
        </Box>
      </Box>
    );
  }

  const handleAbortCampaign = async (data) => {
    if (!data.acceptCondition || !data.campaignAbortReason.trim()) return;
  
    try {
      const accounts = await web3.eth.getAccounts();
      if (!accounts.length) {
        alert("Please connect your wallet.");
        return;
      }
      const success = await abortCampaignAndRefund(campaignData.id, accounts[0]);
  
      if (success) {
        window.location.reload();
        abortReset("", { keepValues: false });
      } else {
        throw new Error("Campaign abort transaction failed.");
      }
    } catch (err) {
      setAbortingError(err);
    }
  };
  

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setShowResponse(false);
  };

  const handleContributedFunds = async (data) => {
    try {
      if (!web3 || !campaignId) {
        return;
      }
  
      const amount = data.contribAmount;
      if (!amount) return;
  
      const accounts = await web3.eth.getAccounts();
      if (!accounts.length) {
        alert("Please connect your wallet.");
        return;
      }
      
      const success = await contributeToCampaign(campaignId, amount, accounts[0]);
  
      if (success) {
        setIsContributionSuccess(true);
      } else {
        throw new Error("Contribution transaction failed.");
      }
    } catch (error) {
      setContributionError(error);
    }
  };
  

  function ShowCampaignDetails() {
    return (
      <>
        <Box sx={{ margin: 5, width: "40%" }}>
          <Stack direction={"column"} spacing={2}>
            <Typography variant="caption">About Campaign</Typography>
            <Container>
              <Stack spacing={0.8}>
                <Box
                  display={"flex"}
                  flexDirection="row"
                  alignItems={"flex-start"}
                >
                  <Typography variant="h4" gutterBottom>
                    {campaignData.title}
                  </Typography>
                  <Chip
                    label={campaignData.campaignStatus}
                    size="small"
                    color={
                      campaignData.campaignStatus == "ACTIVE" ||
                      campaignData.campaignStatus == "SUCCESS"
                        ? "success"
                        : "error"
                    }
                  />
                </Box>
                <Typography variant="body2">
                  {campaignData.description}
                </Typography>

                <Link
                  variant="body2"
                  href={`https://sepolia.etherscan.io/tx/${campaignData.id}`}
                >
                  View on Goerli Etherscan
                </Link>
              </Stack>
            </Container>
            <ShowContributionDetails />
            <EndCampaign />
          </Stack>
        </Box>
      </>
    );
  }
  
  const handleEndCampaignAndCredit = async (event) => {
    try {
      if (!web3 || !campaignId) {
        return;
      }
      const accounts = await web3.eth.getAccounts();
      accounts
      if (!accounts.length) {
        alert("Please connect your wallet.");
        return;
      }
      const success = await endCampaignAndCredit(campaignId,  accounts[0]);
      if (success) {
        alert("Campaign successfully ended and funds credited!");
        window.location.reload();
      }
    } catch (error) {
      setEndAndWithdrawError(error);
    }
  };

  function ShowContributionDetails() {
    return (
      <>
        <Typography variant="caption">Contribution Details</Typography>
        <Container>
          <Typography variant="caption">Minimum Contribution amount</Typography>
          <Typography>{campaignData.minContribAmount} ETH</Typography>
        </Container>
        <Container>
          <Typography variant="caption">Goal</Typography>
          <Typography>{`${campaignData.ethFunded}`} ETH</Typography>
        </Container>
        <Container>
          <Typography variant="caption">
            Wallet Address of FundRaiser
          </Typography>
          <Typography>{`${campaignData.createdBy}`}</Typography>
        </Container>
        <Container>
          <Typography variant="caption">
            Contributions are accepted till <i>(Deadline)</i>
          </Typography>
          <Typography>{`${new Date(campaignData.deadline)}`}</Typography>
          {(campaignData.campaignStatus == "EXPIRED" ||
            campaignData.campaignStatus == "ABORTED") && (
            <Typography>
              <i>No contributions can be accepted now.</i>
            </Typography>
          )}
        </Container>
      </>
    );
  }

  function ShowCampaignBalance() {
    return (
      <>
        <Container
          maxWidth="sm"
          sx={{ padding: 0.5, backgroundColor: "#fae588", borderRadius: 3 }}
        >
          <Typography variant="h6">Campaign balance</Typography>
          <Typography variant="caption">
            Amount stored in smart contract.
          </Typography>
          <LinearProgressWithLabel
            value={(campaignData.ethRaised / campaignData.ethFunded) * 100}
          />
          <Typography variant="body2">
            {`${campaignData.ethRaised}`} ETH funded by{" "}
            {`${campaignData.backersCount}`} backers.
          </Typography>
        </Container>
      </>
    );
  }

  function BecomeBacker() {
    return (
      <Container
        sx={{ padding: 0.5, backgroundColor: "#f1faee", borderRadius: 3 }}
        fixed
        maxWidth="sm"
      >
        <Stack direction="column" spacing={1.2}>
          <Typography variant="h6">Be a backer</Typography>
          <Stack direction="row">
            <Typography variant="caption">
              How much would you like to fund?
            </Typography>
            <Typography
              sx={{ fontStyle: "italic", paddingLeft: 1 }}
              variant="caption"
              color="grey"
            >
              ≥ {campaignData.minContribAmount} ETH &amp; ≤{" "}
              {campaignData.ethFunded -campaignData.ethRaised} ETH
            </Typography>
          </Stack>
          {isContributionSuccess == true ? (
            <Alert
              severity="success"
              sx={{ marginTop: 2, marginBottom: 2 }}
              onClose={() => {
                setIsContributionSuccess(false);
                window.location.reload();
              }}
            >
              <AlertTitle>Funded successfully</AlertTitle>
              Thanks for your valuable contributions.
            </Alert>
          ) : (
            <form onSubmit={contributionHandleSubmit(handleContributedFunds)}>
              <TextField
                label="Contribution amount"
                type={"number"}
                inputProps={{
                  step: campaignData[minAmountKey],
                  min: 0,
                }}
                disabled={contributionFormState.isSubmitting}
                {...contributionRegister("contribAmount", { required: true })}
                helperText="Enter amount in Ether you want to contribute."
                fullWidth
                size="small"
              />
              {contributionError && (
                <Alert
                  severity="error"
                  sx={{ marginTop: 2, marginBottom: 2 }}
                  onClose={() => {
                    setContributionError("");
                    window.location.reload();
                  }}
                >
                  <AlertTitle>{contributionError.name}</AlertTitle>
                  {contributionError.message}
                </Alert>
              )}
              {wallet.status === "connected" ? (
                <LoadingButton
                  variant="contained"
                  type="submit"
                  fullWidth
                  loading={contributionFormState.isSubmitting}
                  sx={{ marginTop: 1 }}
                >
                  Contribute Funds
                </LoadingButton>
              ) : (
                <Alert
                  severity="error"
                  sx={{ margin: 2 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => wallet.connect()}
                    >
                      Connect
                    </Button>
                  }
                >
                  Please connect your wallet to proceed.
                </Alert>
              )}
            </form>
          )}

          <Typography variant="subtitle2" color="grey">
            Scheme - All or Nothing.
          </Typography>
          <Typography variant="caption" paragraph color="grey">
            The money you fund, will be stored in smart contract that you can
            trust. Your money gets refunded in-case if the project doesn't reach
            goal or cancelled in-between, and transferred if reached goal.
          </Typography>
        </Stack>
      </Container>
    );
  }

  function WithDrawFunds() {
    return (
      <Container
        sx={{ padding: 2, backgroundColor: "#FFE8E3", borderRadius: 3 }}
        fixed
        maxWidth="sm"
      >
        <Typography variant="h6" gutterBottom>
          Withdraw Raised Funds
        </Typography>
        <Alert severity="info" sx={{ marginTop: 1 }}>
          To withdraw raised funds, campaign has to be <strong>ended</strong>
        </Alert>
        {endAndWithdrawError && (
          <Alert
            severity="error"
            sx={{ marginTop: 2, marginBottom: 2 }}
            onClose={() => {
              setEndAndWithdrawError("");
              window.location.reload();
            }}
          >
            <AlertTitle>{endAndWithdrawError.name}</AlertTitle>
            {endAndWithdrawError.message}
          </Alert>
        )}
        <form onSubmit={withdrawHandleSubmit(handleEndCampaignAndCredit)}>
          <Alert severity="warning" sx={{ marginTop: 1, marginBottom: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  required
                  color="error"
                  name="acceptConditions"
                  value="yes"
                />
              }
              label="I/We understand that, once campaign has ended it cannot be reversed."
              sx={{ padding: 1 }}
            />
          </Alert>

          <LoadingButton
            type="submit"
            fullWidth
            variant="contained"
            loading={withdrawFormState.isSubmitting}
            color="error"
            disabled={withdrawFormState.isSubmitting}
          >
            End campaign &amp; withdraw
          </LoadingButton>
        </form>
      </Container>
    );
  }

  function EndCampaign() {
    return (
      <>
        {wallet.account === campaignData.createdBy &&
          (campaignData.campaignStatus === "ACTIVE" ||
            campaignData.campaignStatus === "SUCCESS") && (
            <>
              <Typography variant="caption">Danger Zone</Typography>
              <Container
                sx={{
                  backgroundColor: "#e5989b",
                  padding: 1,
                  borderRadius: 3,
                }}
              >
                <Stack direction="row" alignItems={"center"}>
                  <Container>
                    <Typography variant="body1">
                      <strong>Quit</strong> &amp; <strong>Refund</strong>
                    </Typography>
                    <Typography variant="caption">
                      Once you end a campaign, there is no going back. Please be
                      certain.
                    </Typography>
                  </Container>
                  <LoadingButton
                    variant="contained"
                    loading={abortFormState.isSubmitting}
                    color="error"
                    size="small"
                    onClick={() => setShowEndCampaignConfirmation(true)}
                  >
                    Abort campaign
                  </LoadingButton>
                </Stack>
              </Container>
            </>
          )}
      </>
    );
  }

  function EndCampaignDialog() {
    return (
      <>
        <StyledModal
          open={showEndCampaignConfirmation}
          onClose={() => setShowEndCampaignConfirmation(false)}
        >
          <Box
            width={400}
            height={300}
            bgcolor={"background.default"}
            color={"text.primary"}
            p={3}
            borderRadius={3}
            display="flex"
            flexDirection={"column"}
            gap={1}
            sx={{ justifyContent: "center" }}
          >
            <Typography
              variant="h6"
              color="error"
              textAlign="center"
              gutterBottom
            >
              Abort Campaign
            </Typography>
            {abortingError && (
              <Alert
                severity="error"
                sx={{ marginTop: 2, marginBottom: 2 }}
                onClose={() => {
                  setAbortingError("");
                  window.location.reload();
                }}
              >
                <AlertTitle>{abortingError.name}</AlertTitle>
                {abortingError.message}
              </Alert>
            )}
            <form onSubmit={abortHandleSubmit(handleAbortCampaign)}>
              <Stack direction="column">
                <TextField
                  label="Why would you like to abort campaign?"
                  multiline
                  required
                  rows={3}
                  {...abortRegister("campaignAbortReason", {
                    required: true,
                  })}
                  variant="standard"
                  disabled={abortFormState.isSubmitting}
                />
                <Typography variant="caption">
                  This reason will be published in campaign page to notify
                  viewers and backers.
                </Typography>
              </Stack>
              <Stack direction={"column"}>
                <FormControlLabel
                  control={
                    <Checkbox required {...abortRegister("acceptCondition")} />
                  }
                  label="I accept that, if I abort campaign, all the raised money can be refunded back to the backers."
                />

                <LoadingButton
                  color="error"
                  variant="contained"
                  type="submit"
                  fullWidth
                  sx={{ marginTop: 1 }}
                  disabled={abortFormState.isSubmitting}
                >
                  Abort Campaign &amp; Refund to backers
                </LoadingButton>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => setShowEndCampaignConfirmation(false)}
                  fullWidth
                  sx={{ marginTop: 1 }}
                  disabled={abortFormState.isSubmitting}
                >
                  Cancel
                </Button>
              </Stack>
            </form>
          </Box>
        </StyledModal>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Stack
        direction={"row"}
        divider={<Divider orientation="vertical" flexItem />}
        spacing={2}
        justifyContent="space-around"
        alignItems="baseline"
      >
        <ShowCampaignDetails />
        <Box sx={{ margin: 10, width: "60%" }}>
          <Stack direction={"column"} spacing={2}>
            <Typography variant="caption">
              Current Status of campaign
            </Typography>
            <ShowCampaignBalance />
            {campaignData.campaignStatus === "ACTIVE" ||
            campaignData.campaignStatus == "SUCCESS" ? (
              <>
                {wallet.account !== campaignData.createdBy ? (
                  <>
                    <Typography variant="caption" sx={{ margin: 0 }}>
                      Contribute
                    </Typography>
                    <BecomeBacker />
                  </>
                ) : (
                  <>
                    <Typography variant="caption" sx={{ margin: 0 }}>
                      Withdraw
                    </Typography>
                    <WithDrawFunds />
                  </>
                )}
              </>
            ) : (
              <>
                <Typography variant="caption" sx={{ margin: 0 }}>
                  End status
                </Typography>
                <Container>
                  <Typography>
                    {campaignData.campaignStatus == "EXPIRED"
                      ? "Campaign has ended successfully..!!"
                      : "Campign has aborted in between."}
                  </Typography>
                </Container>
              </>
            )}
          </Stack>
        </Box>
      </Stack>
      <EndCampaignDialog />
      <Snackbar
        open={showResponse}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={handleClose} severity={responseSeverity}>
          {responseMsg}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ViewCampaign;