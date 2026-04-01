export const isValidPhoneNumber = (phoneNumber: string) => {
  const phoneRegex = /^255\d{9}$/;
  return phoneRegex.test(phoneNumber);
};

export const isValidEmailAddress = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const channelValidator = (channelType: string, channelValue: string) => {
  const validators = {
    sms: (channelValue) => isValidPhoneNumber(channelValue),
    email: (channelValue) => isValidEmailAddress(channelValue),
  };
  const validate = validators[channelType];
  return validate ? validate(channelValue) : false;
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  if (
    (phoneNumber.startsWith('0') && phoneNumber.length === 10) ||
    (phoneNumber.startsWith('+255') && phoneNumber.length === 13) ||
    (phoneNumber.startsWith('255') && phoneNumber.length === 12) ||
    (!phoneNumber.startsWith('0') && phoneNumber.length === 9)
  ) {
    const phoneNo = phoneNumber.replace(' ', '').slice(-9);
    const formattedNumber = '255' + phoneNo;
    return formattedNumber;
  } else {
    return phoneNumber;
  }
};
