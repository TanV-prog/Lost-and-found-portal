// ---- Helpers ----
function getUsers() {
  return JSON.parse(localStorage.getItem('lf_users')) || [];
}

function saveUsers(users) {
  localStorage.setItem('lf_users', JSON.stringify(users));
}

function setLoggedInUser(user) {
  localStorage.setItem('lf_current_user', JSON.stringify(user));
}

// ---- Toggle between Login and Register forms ----
function showForm(type) {
  document.getElementById('loginForm').classList.toggle('hidden', type !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', type !== 'register');
  document.getElementById('showLogin').classList.toggle('active', type === 'login');
  document.getElementById('showRegister').classList.toggle('active', type === 'register');
}
// ---- Register ----
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name    = document.getElementById('regName').value.trim();
    const dept    = document.getElementById('regDept').value.trim();
    const contact = document.getElementById('regContact').value.trim();
    const email   = document.getElementById('regEmail').value.trim();
    const pass    = document.getElementById('regPass').value;

    const users = getUsers();

    if (users.find(u => u.email === email)) {
      document.getElementById('registerError').textContent = 'Email already registered.';
      return;
    }

    if (contact.length !== 10 || isNaN(contact)) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    users.push({ name, dept, contact, email, pass });
    saveUsers(users);

    document.getElementById('registerError').textContent = '';
    alert('Registered successfully! Please login.');
    showForm('login');
  });
}

// ---- Login ----
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPass').value;

    if (email === 'admin@lostandfound.com' && pass === 'ad123') {
      setLoggedInUser({ name: 'Admin', email, isAdmin: true });
      window.location.href = 'admin.html';
      return;
    }

    const users = getUsers();
    const user  = users.find(u => u.email === email && u.pass === pass);

    if (!user) {
      document.getElementById('loginError').textContent = 'Invalid email or password.';
      return;
    }

    setLoggedInUser(user);
    window.location.href = 'browse.html';
  });
}

// ---- My Claims ----
function toggleMyClaims() {
  const section = document.getElementById('myClaimsSection');
  if (!section) return;

  const isHidden = section.classList.contains('hidden');
  if (isHidden) {
    renderMyClaims();
    section.classList.remove('hidden');
  } else {
    section.classList.add('hidden');
  }
}

function renderMyClaims() {
  const list = document.getElementById('myClaimsList');
  if (!list) return;

  const currentUser = JSON.parse(localStorage.getItem('lf_current_user'));
  const claims = JSON.parse(localStorage.getItem('lf_claims')) || [];
  const items  = getItems();

  const myClaims = claims.filter(c => c.claimedBy === currentUser.email);

  if (myClaims.length === 0) {
    list.innerHTML = '<p class="no-items" style="margin-top:0;">You have not made any claim requests yet.</p>';
    return;
  }

  list.innerHTML = myClaims.map(claim => {
    const item = items.find(i => i.id === claim.itemId);
    return `
      <div class="claim-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <p><strong>${item ? item.title : 'Deleted item'}</strong></p>
            <p class="meta">📍 ${item ? item.location : '-'} &nbsp;|&nbsp; 🗂 ${item ? item.category : '-'}</p>
          </div>
          <span class="badge ${claim.status}">${claim.status.toUpperCase()}</span>
        </div>
        ${claim.status === 'approved' ? `
          <div class="approved-msg">
            ✅ Your claim was approved! Contact the poster: <strong>${item ? item.postedByEmail : 'N/A'}</strong>
          </div>` : ''}
        ${claim.status === 'rejected' ? `
          <div class="rejected-msg">
            ❌ Your claim was rejected by the admin.
          </div>` : ''}
      </div>
    `;
  }).join('');
}

// ---- Helpers for items ----
function getItems() {
  return JSON.parse(localStorage.getItem('lf_items')) || [];
}

function saveItems(items) {
  localStorage.setItem('lf_items', JSON.stringify(items));
}

// ---- Logout ----
function logout() {
  localStorage.removeItem('lf_current_user');
  window.location.href = 'index.html';
}

// ---- Render Items ----
function renderItems() {
  const grid = document.getElementById('itemsGrid');
  if (!grid) return;

  const search = document.getElementById('searchInput').value.toLowerCase();
  const filter = document.getElementById('filterType').value;

  let items = getItems();

  // Apply filter
  if (filter !== 'all') {
    items = items.filter(item => item.type === filter);
  }

  // Apply search
  if (search) {
    items = items.filter(item =>
      item.title.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search)
    );
  }

  // Nothing found
  if (items.length === 0) {
    grid.innerHTML = '<p class="no-items">No items found.</p>';
    return;
  }

  // Render cards
  grid.innerHTML = items.map(item => `
    <div class="item-card">
      <img src="${item.image}" alt="${item.title}">
      <div class="card-body">
        <span class="badge ${item.type}">${item.type.toUpperCase()}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <p class="meta">📍 ${item.location} &nbsp;|&nbsp; 🗂 ${item.category}</p>
        <p class="meta">👤 Posted by: ${item.postedBy}</p>
        <button onclick="claimItem('${item.id}')">Request Claim</button>
      </div>
    </div>
  `).join('');
}

// ---- Claim Item ----
function claimItem(itemId) {
  const currentUser = JSON.parse(localStorage.getItem('lf_current_user'));
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  const claims = JSON.parse(localStorage.getItem('lf_claims')) || [];

  // Prevent duplicate claims
  const alreadyClaimed = claims.find(c => c.itemId === itemId && c.claimedBy === currentUser.email);
  if (alreadyClaimed) {
    alert('You have already requested this item.');
    return;
  }

  claims.push({
    id: Date.now().toString(),
    itemId,
    claimedBy: currentUser.email,
    claimedByName: currentUser.name,
    status: 'pending'
  });

  localStorage.setItem('lf_claims', JSON.stringify(claims));
  alert('Claim request sent!');
}
// ---- Post Item ----
const postForm = document.getElementById('postForm');
if (postForm) {
  postForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const type     = document.getElementById('itemType').value;
    const title    = document.getElementById('itemTitle').value.trim();
    const category = document.getElementById('itemCategory').value.trim();
    const location = document.getElementById('itemLocation').value.trim();
    const desc     = document.getElementById('itemDesc').value.trim();
    const imageFile = document.getElementById('itemImage').files[0];

    if (!imageFile) {
      document.getElementById('postError').textContent = 'Please upload an image.';
      return;
    }

    // Convert image to base64
    const reader = new FileReader();
    reader.onload = function(event) {
      const imageBase64 = event.target.result;

      const currentUser = JSON.parse(localStorage.getItem('lf_current_user'));

      const newItem = {
        id: Date.now().toString(),
        type,
        title,
        category,
        location,
        description: desc,
        image: imageBase64,
        postedBy: currentUser.name,
        postedByEmail: currentUser.email
      };

      const items = getItems();
      items.push(newItem);
      saveItems(items);

      alert('Item posted successfully!');
      window.location.href = 'browse.html';
    };

    reader.readAsDataURL(imageFile);
  });
}
// ---- Admin: Show Tab ----
function showTab(tab) {
  document.getElementById('postsTab').classList.toggle('hidden', tab !== 'posts');
  document.getElementById('claimsTab').classList.toggle('hidden', tab !== 'claims');
  document.getElementById('usersTab').classList.toggle('hidden', tab !== 'users');

  document.getElementById('tabPosts').classList.toggle('active', tab === 'posts');
  document.getElementById('tabClaims').classList.toggle('active', tab === 'claims');
  document.getElementById('tabUsers').classList.toggle('active', tab === 'users');

  if (tab === 'posts')  renderAdminItems();
  if (tab === 'claims') renderClaims();
  if (tab === 'users')  renderUsers();
}

// ---- Admin: Render All Items ----
function renderAdminItems() {
  const grid = document.getElementById('adminItemsGrid');
  if (!grid) return;

  const items = getItems();

  if (items.length === 0) {
    grid.innerHTML = '<p class="no-items">No items posted yet.</p>';
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="item-card">
      <img src="${item.image}" alt="${item.title}">
      <div class="card-body">
        <span class="badge ${item.type}">${item.type.toUpperCase()}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <p class="meta">📍 ${item.location} &nbsp;|&nbsp; 🗂 ${item.category}</p>
        <p class="meta">👤 ${item.postedBy}</p>
        <button onclick="deleteItem('${item.id}')" 
          style="background:#c0392b;">Delete Post</button>
      </div>
    </div>
  `).join('');
}

// ---- Admin: Delete Item ----
function deleteItem(itemId) {
  if (!confirm('Delete this post?')) return;

  let items = getItems();
  items = items.filter(item => item.id !== itemId);
  saveItems(items);

  // Also remove related claims
  let claims = JSON.parse(localStorage.getItem('lf_claims')) || [];
  claims = claims.filter(c => c.itemId !== itemId);
  localStorage.setItem('lf_claims', JSON.stringify(claims));

  renderAdminItems();
}

// ---- Admin: Render Claims ----
function renderClaims() {
  const list = document.getElementById('claimsList');
  if (!list) return;

  const claims = JSON.parse(localStorage.getItem('lf_claims')) || [];
  const items  = getItems();

  if (claims.length === 0) {
    list.innerHTML = '<p class="no-items">No claim requests yet.</p>';
    return;
  }

  list.innerHTML = claims.map(claim => {
    const item = items.find(i => i.id === claim.itemId);
    return `
      <div class="claim-card">
        <p><strong>Item:</strong> ${item ? item.title : 'Deleted item'}</p>
        <p><strong>Claimed by:</strong> ${claim.claimedByName} (${claim.claimedBy})</p>
        <p><strong>Status:</strong> 
          <span class="badge ${claim.status}">${claim.status.toUpperCase()}</span>
        </p>
        <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
          <button onclick="updateClaim('${claim.id}', 'approved')" 
            style="background:#27ae60;">Approve</button>
          <button onclick="updateClaim('${claim.id}', 'rejected')" 
            style="background:#c0392b;">Reject</button>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Admin: Update Claim Status ----
function updateClaim(claimId, status) {
  let claims = JSON.parse(localStorage.getItem('lf_claims')) || [];
  claims = claims.map(c => c.id === claimId ? { ...c, status } : c);
  localStorage.setItem('lf_claims', JSON.stringify(claims));
  renderClaims();
}

// ---- Admin: Render Users ----
function renderUsers() {
  const list = document.getElementById('usersList');
  if (!list) return;

  const users = getUsers();

  if (users.length === 0) {
    list.innerHTML = '<p class="no-items">No users registered yet.</p>';
    return;
  }

  list.innerHTML = users.map(user => `
    <div class="claim-card">
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Department:</strong> ${user.dept}</p>
      <p><strong>Contact:</strong> ${user.contact}</p>
      <button onclick="deleteUser('${user.email}')" 
        style="background:#c0392b; margin-top:0.5rem;">Remove User</button>
    </div>
  `).join('');
}

// ---- Admin: Delete User ----
function deleteUser(email) {
  if (!confirm('Remove this user?')) return;

  let users = getUsers();
  users = users.filter(u => u.email !== email);
  saveUsers(users);

  renderUsers();
}