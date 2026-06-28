/**
 * Bank Management System
 *
 * A Node.js banking application with account management,
 * transaction processing, and business rule enforcement.
 *
 * @author Elemide Joshua Damilare
 * @version 2.0.0
 * @license MIT
 *
 * Version History
 * ------------------------------------------------------------------
 *
 * Current Development: v2.0.0 (In Progress)
 *
 * Completed
 * - feat: Implemented daily withdrawal limit for Savings Accounts
 *   - Maximum of 3 withdrawals per calendar day
 *   - Auto-resets at 00:00 (Africa/Lagos timezone) using
 *     transaction-history date filtering
 *
 * In Progress
 * - feat: Added PIN authentication for sensitive transactions
 *   - 4-digit PIN required for withdraw() and transfer()
 *   - PINs stored securely using bcrypt hashing
 *   - 3 failed PIN attempts automatically lock the account
 *
 * - feat: Added unique transaction IDs to all operations
 *   - ID format: txn_YYYYMMDD_XXX
 *     (e.g., txn_20260616_001)
 *   - Logged in transaction history for auditing and debugging
 *
 * ------------------------------------------------------------------
 *
 * v1.0.0 - 2026-06-01
 * - feat: Initial release
 * - feat: Account lifecycle management with status field
 *   ('Active' | 'Deactivated')
 * - feat: deactivateAccount() method with transaction guard clauses
 * - feat: Input validation layer using regex
 * - feat: Core transactions:
 *   - Deposit
 *   - Withdraw
 *   - Transfer
 * - feat: Persistent transaction history using JSON file storage
 * - feat: SavingsAccount and CurrentAccount support
 */

// Node Modules
const path = require("path");
const fsPromises = require("fs").promises;
const bcrypt = require("bcrypt");

// File DataBase
const usersDB = {
  users: require("./model/users.json"),
  setUsers: function (data) {
    this.users = data;
  },
};

const accountDB = {
  accounts: require("./model/usersAccounts.json"),
  setAccounts: function (data) {
    this.accounts = data;
  },
};

const pinRegex = /^\d{4}$/;
const accountNumberRegex = /^\d{10}$/;

// Classes
class User {
  constructor(_firstName, _lastName, _phoneNumber, _email) {
    this.firstName = _firstName;
    this.lastName = _lastName;
    this.phoneNumber = _phoneNumber;
    this.email = _email;
  }

  async createUser() {
    try {
      let userId;
      let idExist;

      const nameRegex = /^[a-zA-Z]+(?:[a-zA-Z]+)*$/;
      const phoneRegex = /^(\+?234|0)[7-9][0-1]\d{8}$/;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      // Validate user input
      if (!this.firstName) {
        return console.log("First name is required!");
      } else if (!nameRegex.test(this.firstName)) {
        return console.log("First name must contain only alphabet");
      }

      if (!this.lastName) {
        return console.log("Last name is required!");
      } else if (!nameRegex.test(this.lastName)) {
        return console.log("Last name must contain only alphabet");
      }

      if (!this.phoneNumber) {
        return console.log("Phone number is required!");
      } else if (!phoneRegex.test(this.phoneNumber)) {
        return console.log("Invalid Nigerian phone number");
      }

      if (!this.email) {
        return console.log("Email is required!");
      } else if (!emailRegex.test(this.email)) {
        return console.log("Invalid email format");
      }

      // Check if the user exist in the DB
      const existingUser = findUser(this.email, this.phoneNumber);
      if (existingUser)
        return console.log(
          "Email and Phone Number is already registered to another user",
        );

      do {
        userId = generateUserId();
        idExist = usersDB.users?.find((user) => user.id === userId);
      } while (idExist);

      const newUser = {
        id: userId,
        firstName: this.firstName,
        lastName: this.lastName,
        phoneNumber: this.phoneNumber,
        email: this.email,
      };

      usersDB.setUsers([...usersDB.users, newUser]);
      await fsPromises.writeFile(
        path.join(__dirname, "model", "users.json"),
        JSON.stringify(usersDB.users, null, 2),
      );
      console.log(
        `${this.firstName} ${this.lastName} is registered successfully.`,
      );
    } catch (err) {
      console.log(err.message);
    }
  }
}

class AccountManager {
  constructor(_email, _phoneNumber) {
    this.email = _email;
    this.phoneNumber = _phoneNumber;
  }

  async createAccount(accountType, pin) {
    try {
      let accountNumber;
      let exist;

      const accountTypeArr = ["Savings", "Current"];
      const existingUser = findUser(this.email, this.phoneNumber);
      if (!existingUser)
        throw new Error("We couldn't find a user matching those details");
      const existingUserId = existingUser.id;
      const existingAccount = findAccountById(this.email, this.phoneNumber);
      if (existingAccount)
        throw new Error("This account has already been created");
      if (!accountType || !accountTypeArr.includes(accountType))
        throw new Error("Invalid account type!");
      do {
        accountNumber = generateAccountNumber();
        exist = accountDB.accounts?.find(
          (account) => account.accountNumber === accountNumber,
        );
      } while (exist);

      if (pin === undefined || pin === null || pin === "")
        throw new Error("Please input your pin");
      const accountPin = String(pin);
      if (!accountPin || !pinRegex.test(accountPin))
        throw new Error("Invalid PIN. Please enter a 4-digit number");
      const hashedPin = await bcrypt.hash(accountPin, 10);
      const newAccount = {
        id: existingUserId,
        accountNumber: accountNumber,
        accountPin: hashedPin,
        accountType,
        balance: 0,
        email: this.email,
        failedAttempt: 0,
        history: [],
        phoneNumber: this.phoneNumber,
        status: "Active",
        createdAt: new Date().toISOString(),
      };
      accountDB.setAccounts([...accountDB.accounts, newAccount]);
      await saveToFile();
      console.log(
        `Your Account have been successfully created. Thank you for choosing our bank ${existingUser.firstName} ${existingUser.lastName}`,
      );
    } catch (err) {
      console.log(err.message);
    }
  }

  async deposit(cash) {
    try {
      const existingUser = findUser(this.email, this.phoneNumber);
      if (!existingUser)
        console.log("We couldn't find a user matching those details");
      const existingAccount = findAccountById(this.email, this.phoneNumber);
      if (!existingAccount) return console.log("This account does not exist!");
      if (existingAccount.status !== "Active")
        return console.log(
          `Deposits are currently unavailable as your account have been ${existingAccount.status}`,
        );
      let balance = existingAccount.balance;
      const money = Number(cash);
      if (isNaN(money) || money <= 0)
        return console.log("Invalid deposit amount");
      const updatedBalance = balance + money;
      const updatedAccount = updateAccount(
        this.email,
        this.phoneNumber,
        updatedBalance,
      );
      const accountHistory = updatedAccount.find(
        (account) => account.id === existingUser.id,
      ).history;
      accountHistory.push(
        createTransaction(this.email, this.phoneNumber, "Deposit", money),
      );
      accountDB.setAccounts(updatedAccount);
      await saveToFile();
      console.log(
        `Transaction Successful. You deposited $${money} into your account`,
      );
    } catch (err) {
      console.log(err.message);
    }
  }

  async withdraw(amount, pin) {
    try {
      if (amount === undefined || amount === null || amount === "") {
        throw new Error("Please enter an amount");
      }
      if (pin === undefined || pin === null || pin === "")
        throw new Error("Please input your pin");

      const existingUser = findUser(this.email, this.phoneNumber);
      if (!existingUser)
        throw new Error("User account does not exist in our DB");
      const existingAccount = findAccountById(this.email, this.phoneNumber);
      if (!existingAccount)
        throw new Error("Invalid Account. Please Create an account!");
      if (existingAccount.status !== "Active")
        throw new Error(
          `We are unable to process withdrawals because your account is ${existingAccount.status}`,
        );
      const accountPin = String(pin);
      await this.verifyPin(existingUser, existingAccount, accountPin);

      let balance = existingAccount.balance;
      const withdrawalAmount = Number(amount);
      if (isNaN(withdrawalAmount)) throw new Error("Invalid Amount Withdrawal");
      if (withdrawalAmount <= 0)
        throw new Error("Withdrawal amount must be greater than $0");
      if (withdrawalAmount > balance)
        throw new Error("Insufficient Fund. Please Deposit in your account");

      const today = new Date().toISOString().split("T")[0];

      if (existingAccount.accountType === "Savings") {
        const todayWithdrawal = existingAccount.history.filter(
          (arr) => arr.type === "Withdraw" && arr.date.split("T")[0] === today,
        ).length;
        if (todayWithdrawal >= 3)
          throw new Error(
            "Savings Account: Daily withdrawal limit of 3 reached. Try tomorrow",
          );
        balance = balance - withdrawalAmount;
      }

      if (existingAccount.accountType === "Current") {
        balance = balance - withdrawalAmount;
      }
      const updatedAccount = updateAccount(
        this.email,
        this.phoneNumber,
        balance,
      );
      const accountHistory = updatedAccount.find(
        (account) => account.id === existingUser.id,
      ).history;
      accountHistory.push(
        createTransaction(
          this.email,
          this.phoneNumber,
          "Withdraw",
          withdrawalAmount,
        ),
      );
      accountDB.setAccounts(updatedAccount);
      await saveToFile();
      console.log(
        `Transaction Successful. You withdraw $${withdrawalAmount} from your account`,
      );
    } catch (err) {
      console.log(err.message);
    }
  }

  checkBalance() {
    try {
      const existingUser = findUser(this.email, this.phoneNumber);
      if (!existingUser)
        throw new Error("We couldn't find a user matching those details");
      const existingAccount = findAccountById(this.email, this.phoneNumber);
      if (!existingAccount)
        throw new Error("Invalid account. Please create an account");
      const balance = existingAccount.balance;
      console.log(`Your current balance is $${balance}`);
    } catch (err) {
      console.log(err.message);
    }
  }

  async transfer(amount, acctNumber, pin) {
    try {
      if (amount === undefined || amount === null || amount === "")
        throw new Error("Transfer amount is required");
      const money = Number(amount);
      if (isNaN(money))
        throw new Error("Invalid amount. Please enter a valid number");
      if (money <= 0)
        throw new Error("Please enter an amount greater then $0.00");

      if (acctNumber === undefined || acctNumber === null || acctNumber === "")
        throw new Error("Account number is required");
      const accountNumber = Number(acctNumber);
      if (
        isNaN(accountNumber) ||
        String(accountNumber).length < 10 ||
        String(accountNumber).length > 10
      )
        throw new Error("Invalid account number");

      const existingUser = findUser(this.email, this.phoneNumber);
      if (!existingUser)
        throw new Error("Invalid User. Please create your user profile");
      const existingAccount = findAccountById(this.email, this.phoneNumber);
      if (!existingAccount)
        throw new Error("Invalid account. Please create an account");
      if (existingAccount.status !== "Active")
        throw new Error(
          `We are unable to process transfers because your account is ${existingAccount.status}`,
        );

      const recipientAccount = accountDB.accounts.find(
        (account) => account.accountNumber === String(accountNumber),
      );
      if (!recipientAccount)
        throw new Error("Account Number does not exist in our DB");
      if (
        String(existingAccount.accountNumber) === recipientAccount.accountNumber
      )
        throw new Error("You cannot transfer money into your own account");

      let senderBalance = existingAccount.balance;
      if (money > senderBalance)
        throw new Error("Insufficient fund. Please fund your account");

      if (recipientAccount.status !== "Active")
        return console.log(
          `Transfer failed. The recipient account is ${recipientAccount.status}`,
        );

      if (pin === undefined || pin === null || pin === "")
        throw new Error("Your account PIN is required");
      const accountPin = String(pin);
      await this.verifyPin(existingUser, existingAccount, accountPin);

      senderBalance = senderBalance - money;
      const receiverBalance = recipientAccount.balance + money;
      const senderUpdatedAccount = updateAccount(
        this.email,
        this.phoneNumber,
        senderBalance,
      );
      const senderAccountHistory = senderUpdatedAccount.find(
        (account) => account.id === existingUser.id,
      ).history;
      senderAccountHistory.push(
        createTransaction(this.email, this.phoneNumber, "Debit", money),
      );
      accountDB.setAccounts(senderUpdatedAccount);
      console.log(`Transferred Successful. You transferred $${money}.`);

      const recipientAccountHistory = recipientAccount.history;
      recipientAccountHistory.push(
        createTransaction(this.email, this.phoneNumber, "Credit", money),
      );
      const recipientUpdatedAccount = accountDB.accounts.map((account) =>
        account.accountNumber === String(accountNumber)
          ? { ...account, balance: receiverBalance }
          : account,
      );
      accountDB.setAccounts(recipientUpdatedAccount);
      await saveToFile();
      console.log(`Successful. You received $${money}.`);
    } catch (err) {
      console.log(err.message);
    }
  }

  viewHistory() {
    try {
      const existingUser = findUser(this.email, this.phoneNumber);
      if (!existingUser) return console.log("User does not exist in the DB");
      const existingAccount = findAccountById(this.email, this.phoneNumber);
      if (!existingAccount)
        return console.log("Account does not exist. Please create an account");
      const existingAccountHistory = existingAccount.history;
      console.table(existingAccount.history);
    } catch (err) {
      console.log(err.message);
    }
  }

  async deactivateAccount() {
    try {
      const existingUser = findUser(this.email, this.phoneNumber);
      if (!existingUser) return console.log("This user does not exist!");
      const existingAccount = findAccountById(this.email, this.phoneNumber);
      if (!existingAccount)
        return console.log("No account associated with this information");
      if (existingAccount.status === "Deactivated")
        return console.log(
          "This account has been deactivated. Please visit our nearest branch to reactivate",
        );
      const deactivatedAccount = accountDB.accounts.map((account) =>
        account.id === existingUser.id
          ? { ...account, status: "Deactivated" }
          : account,
      );
      accountDB.setAccounts(deactivatedAccount);
      await saveToFile();
      console.log("Your account has been deactivated successfully");
    } catch (err) {
      console.log(err.message);
    }
  }

  async verifyPin(existingUser, existingAccount, accountPin) {
    if (!pinRegex.test(accountPin))
      throw new Error("PIN must be exactly 4 digits");
    const comparePin = await bcrypt.compare(
      accountPin,
      existingAccount.accountPin,
    );
    if (!comparePin) {
      const failedAttempt = existingAccount.failedAttempt + 1;
      const remainingAttempt = 3 - failedAttempt;
      const updatedAccount = accountDB.accounts.map((account) =>
        account.id === existingUser.id
          ? { ...account, failedAttempt }
          : account,
      );
      accountDB.setAccounts(updatedAccount);
      await saveToFile();
      if (failedAttempt >= 3) {
        const updatedAccount = accountDB.accounts.map((account) =>
          account.id === existingUser.id
            ? { ...account, status: "Locked" }
            : account,
        );
        accountDB.setAccounts(updatedAccount);
        await saveToFile();
        throw new Error("Account Locked due to 3 failed PIN attempts");
      }
      throw new Error(`Invalid PIN. ${remainingAttempt} attempt(s) remaining`);
    }

    const newObj = accountDB.accounts.map((account) =>
      account.id === existingUser.id
        ? { ...account, failedAttempt: 0 }
        : account,
    );
    accountDB.setAccounts(newObj);
    await saveToFile();
  }

  async changePin(oldPin, newPin) {
    try {
      const existingUser = findUser(this.email, this.phoneNumber);
      if (!existingUser)
        throw new Error("We couldn't find a user matching those details");
      const existingAccount = findAccountById(this.email, this.phoneNumber);
      if (!existingAccount) throw new Error("This account does not exist!");

      if (oldPin === undefined || oldPin === null || oldPin === "")
        throw new Error("Please input your old PIN");
      const oldAccountPin = String(oldPin);
      if (!pinRegex.test(oldAccountPin))
        throw new Error("PIN must be exactly 4 digits");
      const isOldPinCorrect = await bcrypt.compare(
        oldAccountPin,
        existingAccount.accountPin,
      );
      if (!isOldPinCorrect) throw new Error("Incorrect old PIN");

      if (newPin === undefined || newPin === null || newPin === "")
        throw new Error("Please input your new PIN");
      const newAccountPin = String(newPin);
      if (!pinRegex.test(newAccountPin))
        throw new Error("New PIN must be exactly 4 digits");
      if (oldAccountPin === newAccountPin)
        throw new Error("New PIN cannot be the same as your old PIN");
      const hashedNewPin = await bcrypt.hash(newAccountPin, 10);
      const updatedAccount = accountDB.accounts.map((account) =>
        account.id === existingUser.id
          ? { ...account, accountPin: hashedNewPin }
          : account,
      );
      accountDB.setAccounts(updatedAccount);
      await saveToFile();
      console.log("Your PIN has been changed successfully");
    } catch (err) {
      console.log(err.message);
    }
  }

  async resetPin(acctNumber, pin) {
    try {
      const existingUser = findUser(this.email, this.phoneNumber);
      if (!existingUser)
        throw new Error("We couldn't find a user matching those details");
      const existingAccount = findAccountById(this.email, this.phoneNumber);
      if (!existingAccount) throw new Error("This account does not exist");

      if (acctNumber === undefined || acctNumber === null || acctNumber === "")
        throw new Error("Please input your account number");
      const accountNumber = String(acctNumber);

      if (!accountNumberRegex.test(accountNumber))
        throw new Error("Account number must be 10-digits only.");

      if (existingAccount.accountNumber !== accountNumber)
        throw new Error("Account number does not match our records");

      if (pin === undefined || pin === null || pin === "")
        throw new Error("Please enter a new PIN");

      const newAccountPin = String(pin);

      if (!pinRegex.test(newAccountPin))
        throw new Error("Account PIN must be 4-digits only");

      const isSamePin = await bcrypt.compare(
        newAccountPin,
        existingAccount.accountPin,
      );

      if (isSamePin)
        throw new Error("New PIN cannot be the same as your current PIN");

      const hashedPin = await bcrypt.hash(newAccountPin, 10);

      const updatedAccounts = accountDB.accounts.map((account) =>
        account.id === existingAccount.id
          ? { ...account, accountPin: hashedPin }
          : account,
      );
      accountDB.setAccounts(updatedAccounts);
      await saveToFile();
      console.log("Your account PIN has been reset successfully.");
    } catch (err) {
      console.log(err.message);
    }
  }
}

// Helper Functions
function generateUserId() {
  return `ID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function findUser(email, phone) {
  const existingUser = usersDB.users.find(
    (user) => user.email === email && user.phoneNumber === phone,
  );

  return existingUser;
}

function findAccountById(email, phone) {
  const existingUser = findUser(email, phone);
  if (!existingUser) return null;
  const account = accountDB.accounts.find(
    (account) => account.id === existingUser.id,
  );
  return account;
}

function updateAccount(email, phone, newBalance) {
  const existingUser = findUser(email, phone);

  const updatedAccount = accountDB.accounts.map((account) =>
    account.id === existingUser.id
      ? { ...account, balance: newBalance }
      : account,
  );

  return updatedAccount;
}

function getTodayDate() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const formattedMonth = String(month).padStart(2, "0");
  const date = new Date().getDate();
  const formattedDate = String(date).padStart(2, "0");
  return `${year}${formattedMonth}${formattedDate}`;
}

function getTodayTransactionLog(email, phone) {
  const today = new Date().toISOString().split("T")[0];
  const existingAccount = findAccountById(email, phone).history;
  const todayHistoryLog =
    existingAccount.filter((account) => account.date.split("T")[0] === today)
      .length + 1;
  return String(todayHistoryLog).padStart(3, "0");
}

function createTransaction(email, phoneNumber, type, money) {
  return {
    transactionId: `txn_${getTodayDate()}_${getTodayTransactionLog(email, phoneNumber)}`,
    type,
    amount: money,
    date: new Date().toISOString(),
  };
}

async function saveToFile() {
  await fsPromises.writeFile(
    path.join(__dirname, "model", "usersAccounts.json"),
    JSON.stringify(accountDB.accounts, null, 2),
  );
}

// Variables
const joshua = new User(
  "Joshua",
  "Elemide",
  "07025908646",
  "elemide.j.dev@gmail.com",
);
const joshuaAccount = new AccountManager(
  "elemide.j.dev@gmail.com",
  "07025908646",
);

const david = new User(
  "David",
  "Precious",
  "08187119594",
  "jelemide@byupathway.edu",
);
const davidAccount = new AccountManager(
  "jelemide@byupathway.edu",
  "08187119594",
);

const bola = new User(
  "Bola",
  "Ajayi",
  "07075938646",
  "jelemidea@byupathway.edu",
);
const bolaAccount = new AccountManager(
  "jelemidea@byupathway.edu",
  "07075938646",
);

const excel = new User(
  "Excel",
  "Excellence",
  "09178675342",
  "yinkaseke@gmail.com",
);

const excelAccount = new AccountManager("yinkaseke@gmail.com", "09178675342");
// Execute code
async function run() {
  await joshuaAccount.resetPin(1652087392, "1259");
}

run();
