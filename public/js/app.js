$(document).ready(function () {
  $("#loginForm").submit(function(event) {
    event.preventDefault()
    redirectToUserPage($("#inputEmail").val())
  });
  $("#logoutButton").click(function(event) {
    redirectToPage('index.html')
  });
});

function redirectToPage(page) {
    const path = window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/') + 1)
    window.location.replace(path + page)
}

function redirectToUserPage(email) {
  datas.users.forEach(function(element) {
    if (element.email === email) {
      redirectToPage(element.home)
    }
  })
  console.error(`User ${email} not found`)
}
 
