"use client"

import axios from 'axios';
import { ChangeEvent, useState } from 'react';
import Image from 'next/image'
import { debounce } from 'lodash';
import {toast} from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {BASE_URL} from '../proxy';

const debouncedShowToast = debounce(toast.warn, 300);

export default function Home() {

  const [loadingBuy, setLoadingBuy] = useState<boolean>(false);
  const [loadingCC, setLoadingCC] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('applePay'); // Default to Apple Pay  
  const [productPrice, setProductPrice] = useState<number>(1);
  const [productQuantity, setProductQuantity] = useState<number>(0);
  const [wallet, setWallet] = useState<number>(20);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [noOfItems, setNoOfItems] = useState<number>(10);
  const [rechargeData, setRechargeData] = useState<any>({
    cardNumber : '',
    cvv : '',
    amount : 0
  });

  // Buy product button event handler
  const handleBuyButtonClick = async () => {
    setLoadingBuy(true);
    try {
      if(totalAmount > wallet) {
        toast.warn("Wallet balance not enough");
      } else if(productQuantity < 1) {
        toast.warn("No product selected");
      } else {
        let requestData = {
            "createTransactionRequest": {
                "merchantAuthentication": {
                    "name": "5KP3u95bQpv",
                    "transactionKey": "346HZ32z3fP4hTG2"
                },
                "refId": "123456",
                "transactionRequest": {
                    "transactionType": "authCaptureTransaction",
                    "amount": "50",
                    "payment": {
                        "opaqueData": {
                            "dataDescriptor": paymentMethod == "applePay" ? "COMMON.APPLE.INAPP.PAYMENT" : "COMMON.GOOGLE.INAPP.PAYMENT",
                            "dataValue": "1234567890ABCDEF1111AAAA2222BBBB3333CCCC4444DDDD5555EEEE6666FFFF7777888899990000"
                        }
                    },
                    "lineItems": {
                        "lineItem": {
                            "itemId": "1",
                            "name": "vase",
                            "description": "Cannes logo",
                            "quantity": "18",
                            "unitPrice": "45.00"
                        }
                    },
                    "tax": {
                        "amount": "4.26",
                        "name": "level2 tax name",
                        "description": "level2 tax"
                    },
                    "duty": {
                        "amount": "8.55",
                        "name": "duty name",
                        "description": "duty description"
                    },
                    "shipping": {
                        "amount": "4.26",
                        "name": "level2 tax name",
                        "description": "level2 tax"
                    },
                    "poNumber": "456654",
                    "billTo": {
                        "firstName": "Ellen",
                        "lastName": "Johnson",
                        "company": "Souveniropolis",
                        "address": "14 Main Street",
                        "city": "Pecan Springs",
                        "state": "TX",
                        "zip": "44628",
                        "country": "US"
                    },
                    "shipTo": {
                        "firstName": "China",
                        "lastName": "Bayles",
                        "company": "Thyme for Tea",
                        "address": "12 Main Street",
                        "city": "Pecan Springs",
                        "state": "TX",
                        "zip": "44628",
                        "country": "US"
                    },
                    "customerIP": "192.168.1.1",
                    "userFields": {
                        "userField": [
                            {
                                "name": "MerchantDefinedFieldName1",
                                "value": "MerchantDefinedFieldValue1"
                            },
                            {
                                "name": "favorite_color",
                                "value": "blue"
                            }
                        ]
                    }
                }
            }
        };
        
        // Make a POST request to your Next.js API route
        const response = await axios.post(`${BASE_URL}/pay/method`, {
          requestData // Provide the transaction amount here
        }, { timeout : 10000 });
        
        if(response && response?.data) {
          
          // update the available items
          setNoOfItems(prevValue => {
            let res =  prevValue - productQuantity;
            return res < 1 ? 0 : res;
          });

          // update the selected product quantity
          setProductQuantity(0);

          // Handle the response from the API
          toast.success("Order Placed.");
          console.log('Transaction response:', response.data);

          // update the wallet balance
          setWallet(prevAmount =>  {
            const res = prevAmount - totalAmount;
            return res < 1 ? 0 : res;
          });

          // reset total amount after order placed
          setTotalAmount(0);
        } else {
          toast.error("Request Failed!");
        }

      }
    } catch (error) {
      toast.error("Something went wrong!");
      console.error('Error making API request:', error);
    } finally {
      setLoadingBuy(false);
    }
  };

  // CC recharge event handler
  const handleCreditCardChargeButtonClick = async () => {
    setLoadingCC(true);
    try {
      if (!(rechargeData['cardNumber'] && rechargeData['cvv'] && rechargeData['amount'])) {
        toast.warn("Card Number, CVV, and Amount are required");
      } else {
         // Make a POST request to your Next.js API route
        const response = await axios.post('/api/authorize', {
          rechargeData, // Provide the transaction amount here
        }, { timeout : 10000 });
        
        if(response && response?.data) {
            const {amount} = rechargeData;

            // update the wallet balance on successful response
            setWallet(prev => {
              return prev + amount;
            });
        } else {
          toast.error("Request Failed!");
        }
      }
    } catch (error) {
      toast.error("Something went wrong!");
      console.error('Error making API request:', error);
    } finally {
      setLoadingCC(false);
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setRechargeData({
      cardNumber : '',
      cvv : '',
      amount : 0
    });
    setIsOpen(false);
  };

  const incrementQuantityCount = () => {
    setProductQuantity(prevQuantity => {
      const newQuantity = prevQuantity + 1;
      if (newQuantity > noOfItems) {
        debouncedShowToast("Available product limit reached.");
        return prevQuantity; // Don't update quantity if limit is reached
      }
      setTotalAmount(newQuantity * productPrice);
      return newQuantity;
    });
  };
  
  const decrementQuantityCount = () => {
    setProductQuantity(prevQuantity => {
      const newQuantity = prevQuantity - 1;
      if (newQuantity < 0) {
        return 0; // Ensure quantity doesn't go below zero
      }
      setTotalAmount(newQuantity * productPrice);
      return newQuantity;
    });
  };
  
  // recharge modal data change event handler
  const inputChangeHandler = (event : ChangeEvent<HTMLInputElement>) => {
    const {name, value} = event.target;
    console.log(name, value);
    setRechargeData({
      ...rechargeData,
      [name] : value
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="max-w-sm rounded overflow-hidden shadow-lg">
      <Image className="w-full" src="/assets/image.jpg" alt="Sunset in the mountains" width={200} height={200}/>
        <div className="px-6 py-4">
          <div className="font-bold text-xl mb-2 bg-gray-200">ASUS OLED Display 14-inch  </div>
          <div className='flex flex-row justify-items-center'>
            <p>Price : ${productPrice}  | </p>
            <p className='pl-2'>Available Items : {noOfItems}</p>
          </div>
          <div className='flex flex-row'>
            <p>Quantity : {productQuantity} |</p>
            <div className='ml-1 mr-3 align-center justify-center items center'>
              <button className='ml-2 mr-2 pl-2 pr-2 text-xl text-white rounded bg-blue-500 rounded- hover:text-blue-600' onClick={incrementQuantityCount}> + </button>
              <button className='ml-2 mr-2 pl-2.5 pr-2.5 text-xl text-white rounded bg-blue-500 rounded- hover:text-blue-600' onClick={decrementQuantityCount}> - </button>
            </div>
          </div>
          <div>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="applePay">Apple pay</option>
              <option value="googlePay">Google Pay</option>
            </select>
            <button className='btn-buy text-white' onClick={handleBuyButtonClick} disabled={loadingBuy}>
              {loadingBuy ? 'Processing...' : 'Buy'}
            </button>
          </div>
        </div>

        {/** Product Tags */}
        <div className="px-6">
          <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">#must_buy</span>
          <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">#asus</span>
          <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">#laptops</span>
        </div>
        <br />
        
        {/** View Balance and Recharge card modal opener */}
        <div className='pb-4'>
        <p className='pl-8'>Total Amount : ${totalAmount}</p>
          <div className='flex flex-row pl-8'>
            <p className='pr-1'>Balance : ${wallet}</p>
            {/*<a className=" hover:text-blue-600 flex items-center justify-center" onClick={openModal}>recharge your wallet</a>*/}
        </div>

        {/** Recharge Modal */}
        {isOpen && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded-md flex flex-col">
              {/* Modal content */}
              <input type = "text" name='cardNumber' minLength={12} maxLength={16} value={rechargeData?.card} onChange={inputChangeHandler} className='m-2' placeholder='Enter your card number' required/>
              <input type='password' name='cvv' maxLength={4} value={rechargeData?.cvv} onChange={inputChangeHandler} className = "m-2" placeholder='Enter CVV' required/>
              <input type='text' inputMode='numeric' pattern='\d*' name='amount' value={rechargeData?.amount} onChange={inputChangeHandler} className='m-2' placeholder="0" required/>
              {/* Close button */}
              <button className="px-3 py-1 bg-blue-500 text-white rounded-md mt-4" onClick={handleCreditCardChargeButtonClick}>{loadingCC ? 'Adding...' : 'Add amount'}</button>
              <button className="px-3 py-1 bg-red-500 text-white rounded-md mt-4" onClick={closeModal}>cancel</button>
            </div>
          </div>
        )}
        </div>
      </div>
      <ToastContainer/>
    </main>
  );
}

