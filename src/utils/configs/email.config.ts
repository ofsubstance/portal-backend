export const forgetEmailConfig = (email: string, token: string) => {
  return {
    receiver: email,
    subject: 'Confirm Your Email',
    textContent: `Verification Code`,
    htmlContent: `
              <p>Hey ${email},</p>
              <p>Please use the code below to confirm your email</p>
              <h1>
                  ${token}
              </h1>
              <p>If you did not request this email you can safely ignore it.</p>
                        `,
  };
};

export const loginEmailConfig = (
  email: string,
  firstname: string,
  lastname: string,
  company: string,
  password: string,
) => {
  return {
    receiver: email,
    subject: 'Login Credentials',
    textContent: 'Welcome to Kaz',
    htmlContent: `<p>Dear ${firstname} ${lastname}</p>
      <p>We have registered your Company <b>${company}</b></p>
      <p>Here is your login credentials</p>
      <div>
        email: <b>${email}</b>
        <br/>
        password: <b>${password}</b>
      </div>
  `,
  };
};
