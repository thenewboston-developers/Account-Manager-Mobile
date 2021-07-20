import { Colors, Custom, Typography } from "styles";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Modal, NativeModules, Platform} from "react-native";
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

interface connects { 
  navigation: any; // TODO use navigation props type
}
 
var Aes = NativeModules.Aes

const connectScreen = ({navigation: {navigate}}: connects) => { 

  const dispatch = useDispatch(); 

  const port = useSelector((state: IAppState) => state.loginState.port);
  const nickname = useSelector((state: IAppState) => state.loginState.nickName); 
  const protocol = useSelector((state: IAppState) => state.loginState.protocol);
  const ipAddress = useSelector((state: IAppState) => state.loginState.ipAddress); 
 
  const [lPort, setlPort] = useState<string>(port)
  const [lProtocol, setlProtocol] = useState<string>(protocol == null ? "http" : protocol)
  const [lNickName, setlNickName] = useState<string>(nickname)
  const [lIpAddress, setlIpAddress] = useState<string>(ipAddress == null ? "" : ipAddress)
  const validator_IpAddress = "54.219.183.128"

  const [dlgVisible, setDlgVisible] = useState(false)
  const [dlgMessage, setDlgMessage] = useState("") 
  const [loading, setLoading] = useState(false);
  const [isValid, setValid] = useState(false); 
  const protocols = [{ label: "PROTPCOL", value: "Protocol" }];
  const [seed, setSeed] = useState(""); 
  const lIsCapsule = useSelector((state: IAppState) => state.accountState.isCapsule);
  const lAccounts = useSelector((state: IAppState) => state.accountState.account);
  const [myAccounts, setMyAccounts] = useState(lAccounts == null ? [] : lAccounts); 
  const [isCapsule, setCapsule] = useState(lIsCapsule == null ? false : lIsCapsule); 

  const generateKey = (password: string, salt: string, cost: number, length: number) => Aes.pbkdf2(password, salt, cost, length)
  const decryptData = (encryptedData: { cipher: any; iv: any; }, key: any) => Aes.decrypt(encryptedData.cipher, key, encryptedData.iv)
  const iv_string = '0123456789abcdef0123456789abcdef'; 
  let encrypt_key:any = "";
  let encrypt_string:any = "";
  let plain_string:any = "";
  let encrypt_iv:any = ""; 

  const encryptData = (text: string, key: any) => {
      return Aes.randomKey(16).then((iv: any) => {
          return Aes.encrypt(text, key, iv).then((cipher: any) => ({
              cipher,
              iv,
          }))
      })
  }
  
  const encryptDataIV = (text: string, key: any, iv:any) => {
    return Aes.encrypt(text, key, iv).then((cipher: any) => ({
      cipher,
      iv,
    }))      
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
      } 
      catch (error) {
       console.log(error);
    }
  }  

  const handleSubmit = async()=>{  
  
    if(lIpAddress == "" || lProtocol == null || lProtocol != "http") {
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

          <CustomSelect
            options={protocols}
            selected={lProtocol}
            required={true}
            updateSelected={(selected: any) => {
              setlProtocol(selected) 
            }}
            customStyle={[Custom.mb20]}
            placeholder={{ label: "HTTP", value: "http" }}
          />

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
 