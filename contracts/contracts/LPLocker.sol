// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LPLocker {
    address public immutable token;
    address public immutable factory;
    address public curve;
    string public metadataLabel;

    constructor(address token_, string memory metadataLabel_) {
        token = token_;
        factory = msg.sender;
        metadataLabel = metadataLabel_;
    }

    function setCurve(address curve_) external {
        require(msg.sender == factory, "not factory");
        require(curve == address(0), "curve set");
        curve = curve_;
    }
}
