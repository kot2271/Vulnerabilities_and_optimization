# Academy_V2

## Installation

Clone the repository using the following command:
Install the dependencies using the following command:
```shell
npm i
```

## Deployment

Fill in all the required environment variables(copy .env-example to .env and fill it). 

Deploy contract to the chain (polygon-mumbai):
```shell
npx hardhat run scripts/deploy/deployAcademyV2.ts --network polygonMumbai
```

## Verify

Verify the installation by running the following command:
```shell
npx hardhat verify --network polygonMumbai {CONTRACT_ADDRESS} {EDUCATION_PRICE_IN_WEI}
```

## Tasks

Create a new task(s) and save it(them) in the folder "tasks". Add a new task_name in the file "tasks/index.ts"

Running a addStudent task:
```shell
npx hardhat addStudent --contract {CONTRACT_ADDRESS} --name {STUDENT_NAME} --age {STUDENT_AGE} --student-account {STUDENT_ADDRESS} --network polygonMumbai
```

Running a payAndEnterAcademy task:
```shell
npx hardhat payAndEnterAcademy --contract {CONTRACT_ADDRESS} --name {STUDENT_NAME} --age {STUDENT_AGE} --student-account {STUDENT_ADDRESS} --value {PAYMENT_VALUE_IN_ETHER} --network polygonMumbai
```

Running a checkAddedStudent task:
```shell
npx hardhat checkAddedStudent --contract {CONTRACT_ADDRESS} --student-account {STUDENT_ADDRESS} --network polygonMumbai
```

Running a changeStudentsPerformance task:
```shell
npx hardhat changeStudentsPerformance --contract {CONTRACT_ADDRESS} --student-account {STUDENT_ADDRESS} --new-mark {NEW_STUDENT_MARK} --completion-percent {NEW_STUDENT_COMPLETION_PERCENTAGE} --network polygonMumbai
```

Running a exitAcademyAndRefundMoney task:
```shell
npx hardhat exitAcademyAndRefundMoney --contract {CONTRACT_ADDRESS} --network polygonMumbai
```

Running a sweepEther task:
```shell
npx hardhat sweepEther --contract {CONTRACT_ADDRESS} --to {ADDRESS_TO_TRANSFER_ETHER} --network polygonMumbai
```