import {
  Button,
  Container,
  TextField,
  Typography,
  styled,
  Box,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import React, { useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { LoadingButton } from "@mui/lab";
import NavBar from "../../components/NavBar";
import { useWallet } from "use-wallet";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import moment from "moment";
import crowdHelp from "../../../utils/contract/crowdHelp";
import web3 from "../../../utils/web3";

const api_url = "http://localhost:4000/api/";

function FillCampaignDetails() {
  const wallet = useWallet();
  const navigate = useNavigate();

  // Form handling
  const {
    handleSubmit,
    register,
    formState: { isSubmitting, errors },
    setValue,
    watch,
  } = useForm({
    mode: "onChange",
  });

  const [error, setError] = useState("");
  const [responseMsg, setResponseMsg] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [responseSeverity, setResponseSeverity] = useState("error");

  // Image upload state
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Handle image upload to Cloudinary
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "crowdfund"); // Replace with your upload preset
    formData.append("cloud_name", "dnht1km0x"); // Replace with your cloud name

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dnht1km0x/image/upload", // Replace with your cloud name
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        setValue("bannerUrl", data.secure_url); // Set the URL in the form
        console.log("Image uploaded successfully:", data.secure_url);
      } else {
        console.error("Failed to upload image:", data);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  async function handleFilledCampaignDetails(data) {
    console.log("Form Data:", data);

    try {
      const accounts = await web3.eth.getAccounts();
      await crowdHelp.methods
        .createCampaign(
          data.title,
          data.description,
          web3.utils.toWei(data.minContribAmount, "ether"),
          web3.utils.toWei(data.ethRaised, "ether"),
          moment(
            data.deadlineDate + " " + data.deadlineTime,
            "YYYY-MM-DD HH:mm"
          ).valueOf(),
          data.bannerUrl
        )
        .send({
          from: accounts[0],
        });

      navigate("/"); // Navigate to home page after successful creation
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  }

  const StyledDivLayout = styled("div")(({ theme }) => ({
    width: "auto",
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
      width: 600,
      marginLeft: "auto",
      marginRight: "auto",
    },
  }));

  const StyledDivPaper = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  }));

  const StyledContainer = styled(Container)(({ theme }) => ({
    [theme.breakpoints.up("sm")]: {
      width: "80%",
    },
    [theme.breakpoints.down("sm")]: {
      width: "40%",
    },
  }));

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setShowResponse(false);
  };

  return (
    <>
      <NavBar />
      <StyledContainer sx={{ width: "80%" }}>
        <StyledDivLayout>
          <StyledDivPaper>
            <Typography
              variant="h5"
              textAlign={"center"}
              fontWeight="bold"
              sx={{ paddingBottom: 2.5 }}
            >
              Campaign Details
            </Typography>

            {/* Wallet connection alerts */}
            {wallet.status !== "connected" ? (
              <Alert
                sx={{ marginBottom: 2 }}
                severity="warning"
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
            ) : (
              wallet.status === "error" && (
                <Alert
                  sx={{ marginBottom: 2 }}
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => wallet.connect()}
                    >
                      Try again
                    </Button>
                  }
                >
                  Error connecting to wallet.
                </Alert>
              )
            )}

            {/* Error messages */}
            {error && (
              <Alert sx={{ marginBottom: 2, marginTop: 2 }} severity="error">
                {error}
              </Alert>
            )}
            {errors.title ||
            errors.description ||
            errors.bannerUrl ||
            errors.minContribAmount ||
            errors.ethRaised ||
            errors.walletAddress ||
            errors.deadlineDate ||
            errors.deadlineTime ? (
              <Alert sx={{ marginBottom: 2, marginTop: 2 }} severity="error">
                All fields are required
              </Alert>
            ) : null}

            {/* Form */}
            <form onSubmit={handleSubmit(handleFilledCampaignDetails)}>
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Box display={"flex"} flexDirection="column" gap={2}>
                    <TextField
                      id="title"
                      {...register("title", { required: true })}
                      label="Campaign Title"
                      size="small"
                      fullWidth
                      disabled={isSubmitting}
                      variant="outlined"
                      helperText="About this campaign in 2-3 words"
                    />
                    <TextField
                      id="minContribAmount"
                      {...register("minContribAmount", { required: true })}
                      label="Minimum contribution amount"
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 0.000001 }}
                      fullWidth
                      variant="outlined"
                      helperText="How much minimum amount you are expecting from backers?"
                      disabled={isSubmitting}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    id="description"
                    {...register("description", { required: true })}
                    label="Campaign Description"
                    size="small"
                    multiline
                    rows={4.3}
                    fullWidth
                    helperText="Help people know about this campaign. Keep it simple and short."
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    id="ethRaised"
                    {...register("ethRaised", { required: true })}
                    label="Goal (ETH)"
                    fullWidth
                    size="small"
                    type="number"
                    helperText="Amount to be raised"
                    inputProps={{ step: 0.00001 }}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="upload-button"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="upload-button">
                      <Button
                        variant="contained"
                        component="span"
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Upload Banner Image"}
                      </Button>
                    </label>
                    <TextField
                      id="bannerUrl"
                      {...register("bannerUrl", { required: true })}
                      label="Or Paste Banner Image URL"
                      type="url"
                      size="small"
                      fullWidth
                      helperText="Preferably from unsplash.com, flaticon.com, pexels.com."
                      disabled={isSubmitting}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ padding: 0, margin: 0 }}>
                    <Typography variant="caption" color="GrayText">
                      Campaign ends at
                    </Typography>
                    <Box display={"flex"} flexDirection="row" gap={2}>
                      <TextField
                        id="deadlineDate"
                        {...register("deadlineDate", { required: true })}
                        type={"date"}
                        inputProps={{
                          min: `${new Date(
                            new Date().getTime() + 1 * 1 * 60 * 60 * 1000 // +1 day
                          )
                            .toJSON()
                            .slice(0, 10)}`,
                        }}
                        size="small"
                        disabled={isSubmitting}
                      />
                      <TextField
                        id="deadlineTime"
                        {...register("deadlineTime", { required: true })}
                        type={"time"}
                        size="small"
                        disabled={isSubmitting}
                      />
                    </Box>
                    <Typography variant="caption" color="GrayText">
                      Please set a reasonable range, neither too short nor too
                      long.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    id="walletAddress"
                    name="walletAddress"
                    label="Wallet Address"
                    fullWidth
                    value={wallet.account}
                    inputProps={{ readOnly: true }}
                    size="small"
                    helperText={
                      wallet.status === "connected"
                        ? "This is connected wallet's address. To switch please re-login with required wallet."
                        : "Please connect to the wallet"
                    }
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        required
                        color="secondary"
                        name="acceptConditions"
                        value="yes"
                      />
                    }
                    label="I/We understand that, once these fields are set cannot be updated."
                  />
                </Grid>
              </Grid>
              <LoadingButton
                type="submit"
                loading={isSubmitting}
                variant="contained"
                color="success"
                disabled={isSubmitting}
              >
                Create Campaign
              </LoadingButton>
            </form>
          </StyledDivPaper>
        </StyledDivLayout>
      </StyledContainer>
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

export default FillCampaignDetails;