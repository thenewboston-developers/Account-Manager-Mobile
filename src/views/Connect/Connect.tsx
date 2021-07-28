import { Colors, Custom, Typography } from "styles";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Modal, NativeModules, Dimensions} from "react-native";
import {Account, Bank} from 'thenewboston' 
import CustomButton from "../../components/CustomButton";
// components
import CustomInput from "../../components/CustomInput";
import CustomSelect from "../../components/CustomSelect";
import LinearGradient from 'react-native-linear-gradient';
import DoneModalViewWidget from "../../components/CustomWidgets/DoneModalview";
import Style from "./Style";
import { IAppState } from '../../store/store';
import { useSelector, useDispatch} from 'react-redux';
import { BlurView, VibrancyView } from "@react-native-community/blur";
import { ProtocolAction, IpAddressAction, PortAction, NickNameAction } from '../../actions/loginActions'
import InfoModalWidget from "../../components/InfoModalWidgets/InfoModalview";
import CryptoJS from "crypto-js"
import EncryptedStorage from 'react-native-encrypted-storage';
import { AccountAction, ISCAPSULEAction } from '../../actions/accountActions' 
import { sign } from "tweetnacl";
 
import RNSingleSelect, {
  ISingleSelectDataType,
} from "@freakycoder/react-native-single-select";
import { Base64, nacl } from "react-native-tweetnacl";

interface connects { 
  navigation: any; // TODO use navigation props type
} 
 
var Aes = NativeModules.Aes
type AccountKeys = [Uint8Array, Uint8Array];
const { Ed25519JavaBridge } = NativeModules;

const connectScreen = ({navigation: {navigate}}: connects) => { 

  const dispatch = useDispatch(); 
  const { width: ScreenWidth } = Dimensions.get("window");
  const port = useSelector((state: IAppState) => state.loginState.port);
  const nickname = useSelector((state: IAppState) => state.loginState.nickName); 
  const protocol = useSelector((state: IAppState) => state.loginState.protocol);
  const ipAddress = useSelector((state: IAppState) => state.loginState.ipAddress); 
 
  const [lPort, setlPort] = useState<string>(port)
  const [lProtocol, setlProtocol] = useState<string>(protocol == null ? "http" : protocol)
  const protocolData: Array<ISingleSelectDataType> = [
    { id: 0, value: "HTTP" },
    { id: 1, value: "PROTOCOL" }, 
  ];
  const [dynamicData, setDynamicData] = React.useState<
    Array<ISingleSelectDataType>
  >([]);
  const [lNickName, setlNickName] = useState<string>(nickname)
  const [lIpAddress, setlIpAddress] = useState<string>(ipAddress == null ? "" : ipAddress)
  const validator_IpAddress = "54.219.183.128"

  const [dlgVisible, setDlgVisible] = useState(false)
  const [dlgMessage, setDlgMessage] = useState("") 
  const [loading, setLoading] = useState(false);
  const [isValid, setValid] = useState(false); 
  const protocols = [{ label: "PROTPCOL", value: "Protocol" }];
  const [seed, setSeed] = useState("");  
  const [privateKey, setPrivateKey] = useState(null);  
  const [publicKey, setPublicKey] = useState(null);  
    

  const generateKey = (password: string, salt: string, cost: number, length: number) => Aes.pbkdf2(password, salt, cost, length) 

  function generateFromKey(signingKey: string): AccountKeys {
    const { publicKey: accountNumber, secretKey: signingKey_ } = sign.keyPair.fromSeed(hexToUint8Array(signingKey));
    return [accountNumber, signingKey_];
  }

  function uint8arrayToHex(array: Uint8Array): string {
    return Buffer.from(array).toString("hex");
  }

  function randomKey(): AccountKeys {
    const keyPair = sign.keyPair();
    const { publicKey, secretKey: signingKey } = keyPair;
    const publicKeyHex = uint8arrayToHex(publicKey);
    const signingKeyHex = uint8arrayToHex(signingKey);
    return [publicKey, signingKey];
  }
  
  function fromBothKeys(signingKey: string, accountNumber: string): AccountKeys {
    const accountNumberArray = hexToUint8Array(accountNumber);
    const signingKeyArray = new Uint8Array(64);
    signingKeyArray.set(hexToUint8Array(signingKey));
    signingKeyArray.set(accountNumberArray, 32);
    return [accountNumberArray, signingKeyArray];
  }
  
   

  function hexToUint8Array(arr: string): Uint8Array {
    return new Uint8Array(Buffer.from(arr, "hex"));
  } 

  useEffect(() => {  
    getSeedESP();
  }, []); 

  async function getSeedESP() {
    try {   
      const session = await EncryptedStorage.getItem("seed");   
      if (session !== undefined) { 
           setSeed(session);    
      }   

      const keyPair = await EncryptedStorage.getItem("keyPair");
      if (keyPair == null) {   
        setPrivateKey(JSON.parse(keyPair).privateKey);   
        setPublicKey(JSON.parse(keyPair).publicKey);    
      } 
      else{    
        //const genKeyPair = nacl.box.keyPair()  
        const genKeyPair = randomKey()  
        const exportPubKey = (genKeyPair[0]);
        const exportPriKey = (genKeyPair[1]);  
        setPrivateKey(exportPriKey);   
        setPublicKey(exportPubKey);  
        setKeyPair(exportPubKey, exportPriKey);
      }
       
    }
    catch (error) {
       console.log(error);
    }
    setTimeout(() => {
      setDynamicData(protocolData);
    }, 20000);
  }  

  async function setKeyPair(exportPubKey, exportPriKey) {
    try {
      await EncryptedStorage.setItem(
          "keyPair",
          JSON.stringify({ 
            privateKey: exportPriKey,
            publicKey : exportPubKey, 
        })
      ); 
    } catch (error) {
       console.log(error);
    }
  } 

  const handleSubmit = async()=>{  
    
    if(lIpAddress == "" || lProtocol == null || !(lProtocol == "http" || lProtocol == "HTTP")) {
      return;
    } 
    let bank_url = lProtocol + '://' + lIpAddress + ':' + port;
    
    try{  
      setLoading(true) 
      const bank = new Bank(bank_url);  
      const accounts = await bank.getAccounts();  
      let validator_rul = lProtocol + '://' + validator_IpAddress  
      const validator_bank = new Bank(validator_rul);  
      const Aaccount = await validator_bank.getAccounts({ limit: 1, offset: 0 }); 
      var validator_accounts = [];
      let account_size = Aaccount.count; 
      for(let i = 0; i < account_size; i+=100){
        const part_accounts = await validator_bank.getAccounts({ limit: 100, offset: i });  
        validator_accounts = [...validator_accounts, ...part_accounts.results]; 
      }  

      dispatch(ProtocolAction(lProtocol));
      dispatch(IpAddressAction(lIpAddress))
      dispatch(NickNameAction(lNickName))
      dispatch(PortAction(lPort))
      setLoading(false)
      navigate('login', {
        nickname: lNickName,
        accounts: accounts,
        validator_accounts: validator_accounts,
        bank_url: bank_url, 
      });  
    } catch(err){
      setLoading(false)
      setDlgMessage(err);
      setDlgVisible(true)
      console.log(err)
    }
     
  }

  return (
    <View style={Style.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={Style.formView}>
          <Text style={[Typography.FONT_REGULAR, Style.heading]}>
            Connect to the network
          </Text>
          <Text
            style={[
              Typography.FONT_REGULAR,
              Custom.mt20,
              Custom.mb40,
              { color: "#63737E" },
            ]}
          >
            Please enter the address of a bank
          </Text>

          {/* <CustomSelect
            options={protocols}
            selected={lProtocol}
            required={true}
            updateSelected={(selected: any) => {
              setlProtocol(selected) 
            }}
            customStyle={[Custom.mb20]}
            placeholder={{ label: "HTTP", value: "http" }}
          /> */}
          <RNSingleSelect
            data={dynamicData}
            arrowImageStyle={{width: 15, height: 10}}
            buttonContainerStyle={Style.buttonContainerStyle}
            menuItemTextStyle={Style.menuItemTextStyle}
            menuBarContainerStyle={Style.menuBarContainerStyle}
            placeholderTextStyle={Style.placeholderTextStyle}
            darkMode={true}
            width={ScreenWidth - 20}
            searchEnabled={false}
            menuBarContainerWidth={ScreenWidth - 20}
            menuBarContainerHeight={55 * 2}
            onSelect={(selectedItem: ISingleSelectDataType) => 
              setlProtocol(selectedItem.value) 
            }
            >

          </RNSingleSelect>

          <CustomInput
            name="ipAddress"
            value={lIpAddress}
            staticLabel={false}
            labelText="ip address"                      
            onChangeText={(value: string) => {  
              setlIpAddress(value); 
            }}
            autoCapitalize="none"
          />

          <CustomInput
            name="port"
            value={lPort}
            staticLabel={false}
            labelText="port"
            onChangeText={(value: string) => { 
              setlPort(value);
            }}
            autoCapitalize="none"
          />

          <CustomInput
            name="nickname"
            value={lNickName}
            staticLabel={false}
            labelText="nickname"
            onChangeText={(value: string) => { 
              setlNickName(value); 
            }}
            autoCapitalize="none"
          />

          <CustomButton
            title="Connect To The Network"
            onPress={handleSubmit}
            disabled={!isValid}
            buttonColor={Colors.WHITE}
            loading={loading}
          />
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={dlgVisible}  
        onRequestClose={() => {
          // this.closeButtonFunction()
        }}
        
      >
         <BlurView
          style={Style.absolute}
          blurType="dark"
          blurAmount={5}
          reducedTransparencyFallbackColor="white"
        />
             
         <LinearGradient start={{x: 0, y: 1}} end={{x: 0, y: 0}} colors={['rgba(29, 39, 49, 0.9)', 'rgba(53, 96, 104, 0.9)']} style={Style.doInofContainer}>
            <InfoModalWidget 
                    title={""}
                    message={dlgMessage} 
                    button={"Ok"} 
                    handleOk={() => {
                    setDlgVisible(false);
                }} />
        </LinearGradient> 
        
        
      </Modal>
    </View>
  );
};

export default connectScreen
 