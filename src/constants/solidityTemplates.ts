export const SOLIDITY_TEMPLATES = {
  blank: {
    name: 'Blank Contract',
    description: 'Empty Solidity contract',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyContract {
    
}
`,
  },
  erc20: {
    name: 'ERC20 Token',
    description: 'Standard ERC20 token contract',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract MyToken is IERC20 {
    string public name = "My Token";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(uint256 initialSupply) {
        _totalSupply = initialSupply * 10 ** uint256(decimals);
        _balances[msg.sender] = _totalSupply;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
}
`,
  },
  erc721: {
    name: 'ERC721 NFT',
    description: 'Standard ERC721 NFT contract',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

contract MyNFT is IERC721 {
    string public name = "My NFT";
    string public symbol = "MNFT";
    uint256 private tokenCounter;

    mapping(uint256 => address) private tokenOwners;
    mapping(address => uint256) private balances;
    mapping(uint256 => address) private tokenApprovals;
    mapping(address => mapping(address => bool)) private operatorApprovals;

    function balanceOf(address owner) external view override returns (uint256) {
        require(owner != address(0), "Invalid address");
        return balances[owner];
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        address owner = tokenOwners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    function mint(address to) external returns (uint256) {
        require(to != address(0), "Invalid address");
        uint256 tokenId = tokenCounter++;
        tokenOwners[tokenId] = to;
        balances[to]++;
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function transferFrom(address from, address to, uint256 tokenId) external override {
        address owner = tokenOwners[tokenId];
        require(msg.sender == owner || msg.sender == tokenApprovals[tokenId] || operatorApprovals[owner][msg.sender], "Not authorized");
        require(from == owner, "Invalid transfer");
        require(to != address(0), "Invalid address");

        tokenApprovals[tokenId] = address(0);
        balances[from]--;
        balances[to]++;
        tokenOwners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        transferFrom(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) external override {
        address owner = tokenOwners[tokenId];
        require(msg.sender == owner || operatorApprovals[owner][msg.sender], "Not authorized");
        tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external override {
        operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function getApproved(uint256 tokenId) external view override returns (address) {
        return tokenApprovals[tokenId];
    }

    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        return operatorApprovals[owner][operator];
    }
}
`,
  },
  storage: {
    name: 'Simple Storage',
    description: 'Basic storage contract for learning',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedData;
    address public owner;

    event DataStored(uint256 indexed newValue, address indexed by, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function set(uint256 x) external onlyOwner {
        storedData = x;
        emit DataStored(x, msg.sender, block.timestamp);
    }

    function get() external view returns (uint256) {
        return storedData;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
`,
  },
  voting: {
    name: 'Voting Contract',
    description: 'Simple voting contract',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {
    struct Proposal {
        string description;
        uint256 voteCount;
        uint256 deadline;
        bool executed;
    }

    struct Voter {
        bool hasVoted;
        uint256 vote;
    }

    address public owner;
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => Voter)) public voters;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createProposal(string memory description, uint256 duration) external onlyOwner {
        proposals.push(Proposal({
            description: description,
            voteCount: 0,
            deadline: block.timestamp + duration,
            executed: false
        }));
    }

    function vote(uint256 proposalId) external {
        require(proposalId < proposals.length, "Invalid proposal");
        require(!voters[proposalId][msg.sender].hasVoted, "Already voted");
        require(block.timestamp < proposals[proposalId].deadline, "Voting closed");

        voters[proposalId][msg.sender].hasVoted = true;
        voters[proposalId][msg.sender].vote = proposalId;
        proposals[proposalId].voteCount++;
    }

    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }
}
`,
  },
};

export type TemplateKey = keyof typeof SOLIDITY_TEMPLATES;
