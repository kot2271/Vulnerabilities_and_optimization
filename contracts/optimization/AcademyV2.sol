// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AcademyV2 is AccessControl, ReentrancyGuard {
    /// @dev Role identifier for the admin role.
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @dev Basis point constant for calculations
    uint16 public constant BASIS_POINT = 10000;

    /// @dev Struct representing a student
    struct Student {
        string name;
        uint8 age;
        ActivStatus activeStatus;
        address studentAccount;
        PaymentStatus paymentStatus;
    }

    /// @dev Mapping to store student information
    mapping(address => Student) public students;

    /// @dev Mapping to store student marks
    mapping(address => uint8[]) public marks;

    /// @dev Mapping to store completion percentage of students
    mapping(address => uint8) public completionPercent;

    /// @dev Enum representing the payment status of a student
    enum PaymentStatus {
        NOT_PAID,
        PAID
    }

    /// @dev Enum representing the active status of a student
    enum ActivStatus {
        INACTIVE,
        ACTIVE
    }

    /// @dev Immutable variable representing the education price
    uint256 public immutable educationPrice;

    /// @dev Event emitted when a student is added
    event StudentAdded(address indexed studentAccount);

    /// @dev Event emitted when a student exits and is refunded
    event StudentExited(address indexed studentAccount, uint256 amountRefunded);

    /// @dev Event emitted when a student's performance is changed
    event PerformanceChanged(
        address indexed studentAccount,
        uint8 newMark,
        uint8 completionPercent
    );

    /// @dev Event emitted when Ether is swept from the contract
    event EtherSwept(address indexed to, uint256 amount);

    /// @dev Error thrown when a student is already registered
    error StudentAlreadyRegistered();

    /// @dev Error thrown when a student doesn't exist
    error StudentDoesNotExist();

    /// @dev Error thrown when not enough ether is sent to pay for education
    error NotEnoughEtherSentToPayForEducation();

    /// @dev Error thrown when a student is already inactive
    error StudentAlreadyInactive();

    /// @dev Error thrown when a student fails to exit
    error TransferFailed();

    /// @dev Error thrown when an invalid address is sent
    error InvalidAddress();

    /// @dev Error thrown when no ether is sent to sweep
    error NoEtherToSweep();

    /// @dev Error thrown when a admin fails to send ether
    error FailedToSendEther();

    /// @dev Error thrown when no marks to calculate average
    error NoMarksToCalculateAverage();

    /// @dev Modifier to check if a student doesn't exist
    modifier studentDoesNotExist(address studentAccount) {
        if (students[studentAccount].studentAccount != address(0))
            revert StudentAlreadyRegistered();
        _;
    }

    /// @dev Modifier to check if a student exists
    modifier studentExist(address studentAccount) {
        if (students[studentAccount].studentAccount == address(0))
            revert StudentDoesNotExist();
        _;
    }

    /// @dev Constructor to initialize the education price and grant admin role
    constructor(uint256 _edcuationPrice) {
        educationPrice = _edcuationPrice;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Function to add a student to the academy (without paying)
     * @param name student name
     * @param age student age
     * @param studentAccount student account address
     */
    function addStudent(
        string calldata name,
        uint8 age,
        address studentAccount
    ) external onlyRole(ADMIN_ROLE) studentDoesNotExist(studentAccount) {
        _registerStudent(name, age, studentAccount, PaymentStatus.NOT_PAID);
    }

    /**
     * @dev Function for a student to pay and enter the academy
     * @param name student name
     * @param age student age
     * @param studentAccount student account address
     */
    function payAndEnterAcademy(
        string calldata name,
        uint8 age,
        address studentAccount
    ) external payable studentDoesNotExist(studentAccount) {
        if (msg.value != educationPrice)
            revert NotEnoughEtherSentToPayForEducation();
        _registerStudent(name, age, studentAccount, PaymentStatus.PAID);
    }

    /**
     * @dev Function to exit the academy and refund the money to the student
     */
    function exitAcademyAndRefundMoney()
        external
        nonReentrant
        studentExist(msg.sender)
    {
        Student memory student = students[msg.sender];
        if (student.activeStatus == ActivStatus.INACTIVE)
            revert StudentAlreadyInactive();

        uint256 amountToRepay = 0;
        if (student.paymentStatus == PaymentStatus.PAID) {
            amountToRepay = _calculateRefundAmount(
                completionPercent[student.studentAccount]
            );
            (bool success, ) = payable(msg.sender).call{value: amountToRepay}("");
            if (!success) revert TransferFailed();
        }
        students[msg.sender].activeStatus = ActivStatus.INACTIVE;
        emit StudentExited(msg.sender, amountToRepay);
    }

    /**
     * @dev Function to change a student's performance
     * @param studentAccount student account address
     * @param newMark new mark of the student
     * @param actualCompletionPercent student's actual completion percentage
     */
    function changeStudentsPerformance(
        address studentAccount,
        uint8 newMark,
        uint8 actualCompletionPercent
    ) external onlyRole(ADMIN_ROLE) studentExist(studentAccount) {
        Student memory student = students[studentAccount];
        marks[studentAccount].push(newMark);
        completionPercent[student.studentAccount] = actualCompletionPercent;
        if (actualCompletionPercent == BASIS_POINT / 100) {
            students[studentAccount].activeStatus = ActivStatus.INACTIVE;
        }
        emit PerformanceChanged(
            studentAccount,
            newMark,
            actualCompletionPercent
        );
    }

    /**
     * @dev Function to sweep ether
     * @param to address to send ether
     */
    function sweepEther(address to) external nonReentrant onlyRole(ADMIN_ROLE) {
        if (to == address(0)) revert InvalidAddress();
        uint256 balance = address(this).balance;
        if (balance <= 0) revert NoEtherToSweep();
        (bool success, ) = payable(to).call{value: balance}("");
        if (!success) revert FailedToSendEther();
        emit EtherSwept(to, balance);
    }

    /**
     * @dev Function to get the average rating of a student
     * @param studentAccount student account address
     */
    function getAvgRatingOfStudent(
        address studentAccount
    ) external view studentExist(studentAccount) returns (uint256 avgRating) {
        uint8[] memory studendMarks = marks[studentAccount];
        uint studentMarksLength = studendMarks.length;
        if (studentMarksLength <= 0) revert NoMarksToCalculateAverage();

        uint24 sumOfMarks;
        for (uint16 i = 0; i < studentMarksLength; i++) {
            sumOfMarks += studendMarks[i];
        }
        avgRating = (sumOfMarks * 10 ** 4) / studentMarksLength;
        return avgRating;
    }

    /**
     * @dev Function to add new student
     * @param name student name
     * @param age student age
     * @param studentAccount  student account address
     * @param paymentStatus student payment status (paid or not paid)
     */
    function _registerStudent(
        string calldata name,
        uint8 age,
        address studentAccount,
        PaymentStatus paymentStatus
    ) internal {
        students[studentAccount].name = name;
        students[studentAccount].age = age;
        students[studentAccount].activeStatus = ActivStatus.ACTIVE;
        students[studentAccount].studentAccount = studentAccount;
        students[studentAccount].paymentStatus = paymentStatus;
        emit StudentAdded(studentAccount);
    }

    /**
     * @dev Function to calculate the refund amount
     * @param completionPercent_ the completion percentage of the student
     */
    function _calculateRefundAmount(
        uint8 completionPercent_
    ) internal view returns (uint256) {
        return
            (educationPrice * (BASIS_POINT - completionPercent_)) / BASIS_POINT;
    }
}
