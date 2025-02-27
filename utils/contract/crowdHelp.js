import web3 from "../web3";
import CrowdHelp from "../../artifacts/contracts/CrowdHelp.sol/CrowdHelp.json";

const crowdHelpContractAddress = "0xb1Dc0A64Fea9B5585709679C3731EEb84eC58c08";
const crowdHelp = new web3.eth.Contract(
  CrowdHelp.abi,
  crowdHelpContractAddress
);

export default crowdHelp;
