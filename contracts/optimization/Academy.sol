// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract Academy is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Student {
        string name;
        uint256 age;
        bool isActive;
        uint256[] marks;
        address studentAccount;
        uint256 completionPercent;
        bool paid;
    }

    uint256 public basisPoint = 10000;

    Student[] public students;

    uint256 public educationPrice;

    constructor(uint256 _edcuationPrice) {
        educationPrice = _edcuationPrice;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function addStudent(
        Student memory _newStudent
    ) public onlyRole(ADMIN_ROLE) {
        _addStudent(_newStudent, false);
    }

    function payAndEnterAcademy(Student memory _newStudent) public payable {
        require(
            msg.value == educationPrice,
            "Not enough ether sent, to pay for education."
        );
        _addStudent(_newStudent, true);
    }

    function exitAcademyAndRefundMoney() public payable {
        uint256 i;
        for (i = 0; i < students.length; i++) {
            if (students[i].studentAccount == tx.origin) {
                break;
            }
        }

        Student memory student = students[i];
        require(student.studentAccount != address(0), "student doesn't exist");
        require(student.isActive, "student already inactive.");
        if (student.paid) {
            uint256 amountToRepay = (educationPrice *
                (basisPoint - student.completionPercent)) / basisPoint;

            (bool success, ) = tx.origin.call{value: amountToRepay}("");
            require(success, "transfer failed");
        }

        students[i].isActive = false;
    }

    function _addStudent(Student memory _newStudent, bool paid) internal {
        require(
            bytes(_newStudent.name).length == 0 &&
                _newStudent.completionPercent == 0 &&
                _newStudent.marks.length == 0 &&
                _newStudent.isActive == true &&
                _newStudent.studentAccount != address(0),
            "invalid input parameters"
        );
        for (uint256 i = 0; i < students.length; i++) {
            require(
                students[i].studentAccount != _newStudent.studentAccount,
                "Student already registred."
            );
        }
        _newStudent.paid = paid;
        students.push(_newStudent);
    }

    function getAvgRatingOfStudent(
        address studentAccount
    ) external view returns (uint256 avgRating) {
        uint256 sumOfMarks;
        Student memory student;
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].studentAccount == studentAccount)
                student = students[i];
        }

        for (uint256 i; i < student.marks.length; i++)
            sumOfMarks += student.marks[i];

        return (sumOfMarks * basisPoint) / student.marks.length;
    }

    function changeStudentsPerfomance(
        address studentAccount,
        uint256 newMark,
        uint256 completionPercent
    ) public onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].studentAccount == studentAccount) {
                students[i].marks.push(newMark);
                students[i].completionPercent = completionPercent;
                if (completionPercent == basisPoint)
                    students[i].isActive = false;
                break;
            }
        }
    }

    function sweepEther(address to) external onlyRole(ADMIN_ROLE) {
        (bool success, ) = to.call{value: address(this).balance}("");
        require(success, "Failed to send ether.");
    }
}
