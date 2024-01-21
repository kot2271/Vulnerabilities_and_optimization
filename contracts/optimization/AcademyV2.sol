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

    /// @dev Mapping to track if a student exists
    mapping(address => bool) private studentExists;

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

    /// @dev Modifier to check if a student doesn't exist
    modifier studentDoesNotExist(address studentAccount) {
        require(!studentExists[studentAccount], "Student already registered.");
        _;
    }

    /// @dev Modifier to check if a student exists
    modifier studentExist(address studentAccount) {
        require(studentExists[studentAccount], "Student doesn't exist!");
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
        require(
            msg.value == educationPrice,
            "Not enough ether sent, to pay for education."
        );
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
        require(
            student.activeStatus == ActivStatus.ACTIVE,
            "Student already inactive."
        );

        if (student.paymentStatus == PaymentStatus.PAID) {
            uint256 amountToRepay = _calculateRefundAmount(
                completionPercent[student.studentAccount]
            );
            (bool success, ) = payable(msg.sender).call{value: amountToRepay}(
                ""
            );
            require(success, "Transfer failed");
            emit StudentExited(msg.sender, amountToRepay);
        } else {
            emit StudentExited(msg.sender, 0);
        }
        students[msg.sender].activeStatus = ActivStatus.INACTIVE;
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
        require(to != address(0), "Address 'to' cannot be zero.");
        uint256 balance = address(this).balance;
        require(balance > 0, "No ether to sweep.");
        (bool success, ) = payable(to).call{value: balance}("");
        require(success, "Failed to send ether.");
        emit EtherSwept(to, balance);
    }

    /**
     * @dev Function to get the average rating of a student
     * @param studentAccount student account address
     */
    function getAvgRatingOfStudent(
        address studentAccount
    ) external view returns (uint256 avgRating) {
        Student memory student = students[studentAccount];
        require(student.studentAccount != address(0), "Student doesn't exist");
        uint8[] memory studendMarks = marks[studentAccount];
        require(studendMarks.length > 0, "No marks to calculate average");

        uint24 sumOfMarks;
        for (uint16 i = 0; i < studendMarks.length; i++) {
            sumOfMarks += studendMarks[i];
        }
        avgRating = (sumOfMarks * 10 ** 4) / studendMarks.length;
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
        Student memory newStudent = Student({
            name: name,
            age: age,
            activeStatus: ActivStatus.ACTIVE,
            studentAccount: studentAccount,
            paymentStatus: paymentStatus
        });

        students[studentAccount] = newStudent;
        studentExists[studentAccount] = true;
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
