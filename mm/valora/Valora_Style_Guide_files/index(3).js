module.exports.userman_mixins = function (objectTemplate, requires, moduleConfig, nconf)
{

  if (typeof(require) != "undefined") {
    var Q = require('q');
    var crypto = require('crypto');
    var urlparser = require('url');
  }

  function log(level, message) {
    objectTemplate.log(level, message);
  }

  /*
   * SecurityContext can be retrieved using getSecurityContext on any object to
   * find out who is logged in and what there roll is
   */
  objectTemplate.globalInject(function (obj) {
    obj.getSecurityContext = function () {
      return objectTemplate.controller.securityContext || new SecurityContext();
    }
  });

  var Controller = requires[moduleConfig.controller.require][moduleConfig.controller.template]
  var principals = moduleConfig.principal instanceof Array ? moduleConfig.principal : [moduleConfig.principal];
  var maxLoginAttempts = moduleConfig.maxLoginAttempts || 0;
  var maxLoginPeriodMinutes = moduleConfig.maxLoginAttemptsPeriodHours ? moduleConfig.maxLoginAttemptsPeriodHours * 60 : 0;
  var temporaryPasswordExpiresMinutes = moduleConfig.temporaryPasswordExpiresHours ?
  moduleConfig.temporaryPasswordExpiresHours * 60 : 0;
  var passwordExpiresMinutes = moduleConfig.passwordExpiresDays ? moduleConfig.passwordExpiresDays * 24 * 60 : 0;
  var maxPreviousPasswords = moduleConfig.maxPreviousPasswords || 0;
  var defaultAdminRole = moduleConfig.defaultRole || "admin";
  var deferEmailChange = moduleConfig.deferEmailChange ? true : false;

  var controllerFields = moduleConfig.controller.fields || {};
  var principalProperty = controllerFields.principal || 'principal';

  // Add the property filter on a query
  function queryFilter(query) {
    if (moduleConfig.filterProperty && moduleConfig.filterValue) {
      query[moduleConfig.filterProperty] = moduleConfig.filterValue;
    }
    return query;
  }
  // Add the property value to an object (principal)
  function insertFilter(obj) {
    if (moduleConfig.filterProperty && moduleConfig.filterValue) {
      obj[moduleConfig.filterProperty] = moduleConfig.filterValue;
    }
  }

  for (var ix = 0; ix < principals.length; ++ix)
  {
    var Principal = requires[principals[ix].require][principals[ix].template];

    Principal.mixin(
      {
        // These secure elements are NEVER transmitted

        passwordHash: {toClient: false, toServer: false, type: String},
        passwordSalt: {toClient: false, toServer: false, type: String },

        passwordChangeHash: {toClient: false, toServer: false, type: String, value: ""},
        passwordChangeSalt: {toClient: false, toServer: false, type: String, value: ""},
        passwordChangeExpires: {toClient: false, toServer: false, type: Date},

        validateEmailCode: {toClient: false, toServer: false, type: String}, // If present status is pending
        emailValidated:    {toServer: false, type: Boolean, value: false},

        suspended:              {toServer: false, type: Boolean, value: false},
        lockedOut:              {toServer: false, type: Boolean, value: false},
        unsuccesfulLogins:      {toServer: false, toClient: false, type: Array, of: Date, value: []},
        passwordExpires:        {toServer: false, type: Date},
        mustChangePassword:     {toServer: false, type: Boolean, value: false},
        previousSalts:          {toServer: false, toClient: false, type: Array, of: String, value: []},
        previousHashes:         {toServer: false, toClient: false, type: Array, of: String, value: []},

        role: {toServer: false, type: String, init: "user", values: {
          "user": "User",             // A normal user
          defaultAdminRole: "Administrator"}   // An administrative user
        },

        roleSet: {on: "server", body: function (role) {
          if (this.getSecurityContext().role == defaultAdminRole)
            this.role = role;
          else
            throw {code: "role_change", text: "You cannot change roles"};
        }},
        suspendUser: {on: "server", body: function (suspended) {
          if (this.getSecurityContext().role == defaultAdminRole && (this.role != defaultAdminRole))
            this.suspended = suspended;
          else
            throw {code: "suspend_change", text: "You cannot suspend/resume"};
          return this.persistSave();
        }},
        changeEmail: {on: "server", body: function (email) {
          if (this.getSecurityContext().role == defaultAdminRole && (this.role != defaultAdminRole))
            return Principal.getFromPersistWithQuery(queryFilter({email: email})).then(function (principals) {
              if (principals.length > 0)
                throw {code: "email_change_exists", text: "Email already exists"};
              this.email = email;
              return this.persistSave();
            }.bind(this));
          else
            throw {code: "email_change", text: "You cannot change email"};
        }},

        setRoleForUser: {on: "server", body: function (role) {
          this.roleSet(role);
          return this.persistSave();
        }},

        isAdmin: function () {
          return this.role == defaultAdminRole;
        },
        /**
         * Create a password hash and save the object
         *
         * @param password
         * @returns {*} promise (true) when done
         * throws an exception if the password does not meet password rules
         */
        establishPassword: function (password, expires, noValidate, forceChange) {
          if (!noValidate)
            this.validateNewPassword(password);

          var promises = [];
          if (maxPreviousPasswords)
            for (var ix = 0; ix < this.previousHashes.length; ++ix)
              (function () {
                var closureIx = ix;
                promises.push(this.getHash(password, this.previousSalts[closureIx]).then(function (hash) {
                  if (this.previousHashes[closureIx] === hash)
                    throw {code: "last3", text: "Password same as one of last " + maxPreviousPasswords};
                  return Q(true);
                }.bind(this)));
              }.bind(this))()
          return Q.all(promises).then(function ()
          {
            // Get a random number as the salt
            return this.getSalt().then(function (salt) {
              this.passwordSalt = salt;
              this.passwordChangeHash = "";

              // Create a hash of the password with the salt
              return this.getHash(password, salt);

            }.bind(this)).then(function (hash) {
              // Save this for verification later
              this.passwordHash = hash;
              while (this.previousSalts.length > maxPreviousPasswords)
                this.previousSalts.splice(0, 1);
              while (this.previousHashes.length > maxPreviousPasswords)
                this.previousHashes.splice(0, 1);
              this.previousSalts.push(this.passwordSalt);
              this.previousHashes.push(this.passwordHash);
              this.passwordExpires = expires;
              this.mustChangePassword = forceChange || false;
              return this.persistSave();
            }.bind(this));

          }.bind(this));
        },

        /**
         * Check password rules for a new password
         *
         * @param password
         * @return {*}
         */
        validateNewPassword: function (password) {
          if (typeof(this.passwordValidation) == "function")
            return this.passwordValidation(password);
          if (password.length < 6 || password.length > 30 || !password.match(/[A-Za-z]/) || !password.match(/[0-9]/))

            throw {code: "password_composition",
              text: "Password must be 6-30 characters with at least one letter and one number"};
        },

        /**
         * Return a password hash
         *
         * @param password
         * @param salt
         * @return {*}
         */
        getHash: function (password, salt) {
          return Q.ninvoke(crypto, 'pbkdf2', password, salt, 10000, 64).then(function (whyAString) {
            return Q((new Buffer(whyAString, 'binary')).toString('hex'));
          });
        },

        /**
         * Get a secure random string for the salt
         *
         * @return {*}
         */
        getSalt: function () {
          return Q.ninvoke(crypto, 'randomBytes', 64).then(function (buf) {
            return Q(buf.toString('hex'));
          });
        },

        /*
         * Make registration pending verification of a code usually sent by email
         */
        setEmailVerificationCode: function () {
          this.emailValidated = false;
          if (moduleConfig.validateEmailHumanReadable) {
            this.validateEmailCode = Math.random().toString().substr(2,4);
            return this.persistSave();
          } else
            return this.getSalt().then(function (salt) {
              this.validateEmailCode = salt.substr(10, 6);
              return this.persistSave();

            }.bind(this));
        },

        /*
         * Verify the email code passed in and reset the principal record to allow registration to proceed
         */
        consumeEmailVerificationCode: function (code) {
          if (code != this.validateEmailCode)
            throw {code: "inavlid_validation_link", text: "Incorrect email validation link"}

          //this.validateEmailCode = false;
          this.emailValidated = true;
          return this.persistSave();
        },

        /**
         * Create a one-way hash for changing passwords
         * @returns {*}
         */
        setPasswordChangeHash: function () {
          var token;
          return this.getSalt().then(function (salt) {
            token = salt;
            return this.getSalt();
          }.bind(this)).then(function (salt) {
            this.passwordChangeSalt = salt;
            return this.getHash(token, salt);
          }.bind(this)).then(function (hash) {
            this.passwordChangeHash = hash;
            this.passwordChangeExpires = new Date(((new Date()).getTime() +
            (moduleConfig.passwordChangeExpiresHours || 24) * 60 * 60 * 1000));
            return this.persistSave();
          }.bind(this)).then(function () {
            return Q(token);
          }.bind(this));
        },

        /**
         * Consume a password change token and change the password
         *
         * @param token
         * @returns {*}
         */
        consumePasswordChangeToken: function (token, newPassword) {
          if (!this.passwordChangeHash)
            throw {code: "password_reset_used", text: "Password change link already used"};
          return this.getHash(token, this.passwordChangeSalt).then(function (hash) {
            if (this.passwordChangeHash != hash)
              throw {code: "invalid_password_change_link", text: "Incorrect password change link"};
            if (this.passwordChangeExpires.getTime() < (new Date()).getTime())
              throw {code: "password_change_link_expired", text: "Password change link expired"};
            return this.establishPassword(newPassword);
          }.bind(this));
        },

        /**
         * Verify a password on login (don't reveal password vs. user name is bad)
         *
         * @param password
         * @returns {*}
         */
        authenticate: function (password, loggedIn, novalidate) {
          if (!novalidate && this.validateEmailCode && moduleConfig.validateEmailForce)

            throw {code: "registration_unverified",
              text: "Please click on the link in your verification email to activate this account"};

          if (this.lockedOut)
            throw {code: "locked out", text: "Please contact your security administrator"};

          if (this.passwordExpires && (new Date()).getTime() > this.passwordExpires.getTime())
            throw {code: "loginexpired", text: "Your password has expired"};

          return this.getHash(password, this.passwordSalt).then(function (hash) {
            if (this.passwordHash !== hash) {
              return this.badLogin().then(function () {
                this.persistSave();
                throw loggedIn ?
                {code: "invalid_password", text: "Incorrect password"} :
                {code: "invalid_email_or_password", text: "Incorrect email or password"};
              }.bind(this));
            } else {
            }
            return Q(true);

          }.bind(this))
        },

        badLogin: function () {
          if (maxLoginAttempts) {
            this.unsuccesfulLogins.push(new Date());
            this.unsuccesfulLogins = _.filter(this.unsuccesfulLogins, function (attempt) {
              return ((new Date(attempt)).getTime() > ((new Date()).getTime() - 1000 * 60 * maxLoginPeriodMinutes));
            });
            if (this.unsuccesfulLogins.length > maxLoginAttempts) {
              if (this.role != defaultAdminRole) {
                this.lockedOut = true;
              }
              return Q.delay(10000)
            }
            return Q.delay(1000);
          } else
            return Q.delay(2000)
        }

      });
  }

  var Principal = requires[principals[0].require][principals[0].template];
  var SecurityContext = objectTemplate.create("SecurityContext",
    {
      principal: {toServer: false, type: Principal},
      role: {toServer: false, type: String},
      init: function (principal, role) {
        this.principal = principal;
        this.role = role;
      },
      isLoggedIn: function () {
        return !!this.role;
      },
      isAdmin: function () {
        return this.isLoggedIn() && this.principal.role == defaultAdminRole;
      }
    });

  // Inject principal
  if (!Controller.getProperties()[principalProperty])
  {
    var principalDef = {};
    principalDef[principalProperty] = {toServer: false, type: Principal};
    Controller.mixin(principalDef);
  }
  Controller.mixin(
    {
      firstName:              {type: String, value: "", length: 50, rule: ["name", "required"]},
      lastName:               {type: String, value: "", length: 50, rule: ["name", "required"]},
      email:                  {type: String, value: "", length: 50, rule: ["text", "email", "required"]},
      newEmail:               {type: String, value: "", length: 50, rule: ["text", "email", "required"]},

      // Secure variables never leaked to the client

      password:               {toClient: false, type: String, value: ""},
      confirmPassword:        {toClient: false, type: String, value: "", rule:["required"]},
      newPassword:            {toClient: false, type: String, value: "", rule:["required"]},

      passwordChangeHash:     {toClient: false, type: String},
      verifyEmailCode:        {toClient: false, type: String},

      loggedIn:               {toServer: false, type: Boolean, value: false},
      loggedInRole:           {toServer: false, type: String},

      isAdmin: function () {
        return this.loggedIn && this.loggedInRole == defaultAdminRole;
      },
      isLoggedIn: function () {
        return !!this.loggedIn;
      },
      securityContext:        {type: SecurityContext},

      createAdmin: function () {
        Principal.countFromPersistWithQuery({role: defaultAdminRole}).then(function (count) {
          if (count == 0) {
            var admin = new Principal();
            admin.email = moduleConfig.defaultEmail || "amorphic@amorphic.com";
            admin.firstName = "Admin";
            admin.lastName = "User";
            admin.role = defaultAdminRole;
            return admin.establishPassword(moduleConfig.defaultPassword || "admin", null, true, true);
          } else
            return Q(false);
        });
      },

      /**
       * Create a new principal if one does not exist. This method is used by the currently logged in user to create
       * new users. The principal info comes from the an object which should have the following properties:
       *
       * firstName, lastName, email, newPassword, confirmPassword, role
       *
       * Also used to reset a password
       */
      createNewAdmin: {
        on: "server",
        validate: function(){
          return this.validate(document.getElementById('publicRegisterFields'));
        },
        body: function(adminUser, url, pageConfirmation, pageInstructions, reset){

          // Check for security context of security admin
          if(this.loggedInRole !== moduleConfig.defaultRole){
            throw {code: 'cannotcreateadmin', text: "Only a security admin can create users"};
          }
          if (adminUser.newPassword != adminUser.confirmPassword)
            throw {code: 'passwordmismatch', text: "Password's are not the same"};

          var principal;

          url = url ? urlparser.parse(url, true) : "";
          return Principal.getFromPersistWithQuery({email: adminUser.email}).then( function (principals)
          {
            if (reset) {
              if (principals.length == 0)
                throw {code: "email_notfound", text: "Can't find this user"};
              principal = principals[0];
            } else {
              if (principals.length > 0)
                throw {code: "email_registered", text:"This email is already registered"};
              principal = new Principal();
            }

            // this[principalProperty] = this[principalProperty] || new Principal();
            principal.lockedOut = false;
            if (!reset) {
              principal.email = adminUser.email;
              principal.firstName = adminUser.firstName;
              principal.lastName = adminUser.lastName;
              principal.role = adminUser.role;
            }
            return principal.establishPassword(adminUser.newPassword,
              principal.role == defaultAdminRole ? null :
                new Date((new Date()).getTime() + temporaryPasswordExpiresMinutes * 1000 * 60), false, true);

          }.bind(this)).then( function() {
            if (moduleConfig.validateEmail)
              return principal.setEmailVerificationCode();
            else {
              return Q();
            }
          }.bind(this)).then (function ()
          {
            if (url)
              this.sendEmail(moduleConfig.validateEmail ? "register_verify": "register",
                principal.email, this.firstName + " " + this.lastName, [
                  {name: "firstName", content: this.firstName},
                  {name: "email", content: this.email},
                  {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
                  (url.port > 1000 ? ':' + url.port : '') +
                  "?email=" + encodeURIComponent(this.email) +
                  "&code=" + principal.validateEmailCode + "#verify_email"}
                ]);
            if (moduleConfig.validateEmail && pageInstructions)
              return this.setPage(pageInstructions);
            if (!moduleConfig.validateEmail && pageConfirmation)
              return this.setPage(pageConfirmation);
            return Q(principal);
          }.bind(this))
        }},

      /**
       * Create a new principal if one does not exist and consider ourselves logged in
       *
       * @param password
       */
      publicRegister: {
        on: "server",
        validate: function () {
          return this.validate(document.getElementById('publicRegisterFields'));
        },
        body: function (url, pageConfirmation, pageInstructions)
        {
          if (this.newPassword != this.confirmPassword)
            throw {code: 'passwordmismatch', text: "Password's are not the same"};

          var principal;

          url = urlparser.parse(url, true);
          return Principal.countFromPersistWithQuery(queryFilter({email: this.email})).then( function (count)
          {
            if (count > 0)
              throw {code: "email_registered", text:"This email already registered"};

            this[principalProperty] = this[principalProperty] || new Principal();
            principal = this[principalProperty];
            principal.email = this.email;
            principal.firstName = this.firstName;
            principal.lastName = this.lastName;
            insertFilter(principal);
            return principal.establishPassword(this.newPassword);

          }.bind(this)).then( function() {
            if (moduleConfig.validateEmail)
              return principal.setEmailVerificationCode();
            else
              return Q(true);
          }.bind(this)).then( function () {
            if (!moduleConfig.validateEmail || moduleConfig.validateEmailAndLogin)
              this.setLoggedInState(principal);
            this.sendEmail(moduleConfig.validateEmail ? "register_verify": "register",
              principal.email, principal.firstName + " " + principal.lastName, [
                {name: "firstName", content: this.firstName},
                {name: "email", content: this.email},
                {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
                (url.port > 1000 ? ':' + url.port : '') +
                "?email=" + encodeURIComponent(this.email) +
                "&code=" + principal.validateEmailCode + "#verify_email"},
                {name: "verificationCode", content: this[principalProperty].validateEmailCode}

              ]);
            if (moduleConfig.validateEmail && pageInstructions)
              return this.setPage(pageInstructions);
            if (!moduleConfig.validateEmail && pageConfirmation)
              return this.setPage(pageConfirmation);

          }.bind(this))
        }},

      /**
       * login the user
       */
      publicLogin: {
        on: "server",
        validate: function () {return this.validate(document.getElementById('publicLoginFields'))},
        body: function(page, forceChange)
        {
          var principal;
          if (this.loggedIn)
            throw {code: "already_loggedin", text: "Already logged in"};

          var query = Principal.getFromPersistWithQuery(
            queryFilter({email: { $regex: new RegExp("^" + this.email.toLowerCase().replace(/([^0-9a-zA-Z])/g, "\\$1") + '$'), $options: 'i' }}),
            null, null, null, true);
          return query.then(function (principals) {
            if (principals.length == 0 || principals[0].suspended) {
              log(1, "Log In attempt for " + this.email + " failed (invalid email)");
              throw {code: "invalid_email_or_password",
                text: "Incorrect email or password"};
            }
            principal = principals[0];
            return principal.authenticate(this.password);
          }.bind(this)).then( function() {
            return Principal.getFromPersistWithId(principal._id);
          }.bind(this)).then( function(p) {
            principal = p;
            forceChange = forceChange || principal.mustChangePassword;
            if (forceChange && !this.newPassword)
              throw {code: "changePassword", text: "Please change your password"};
            return forceChange ? this.changePasswordForPrincipal(principal) : Q(true);
          }.bind(this)).then( function (status) {
            if (status)
              this.setLoggedInState(principal);
            return page ? this.setPage(page) : Q(true);
          }.bind(this))
        }},

      /**
       * login the user with changed email. Also verify email code
       */
      publicLoginWithNewEmail: {
        on: "server",
        validate: function () {return this.validate(document.getElementById('publicLoginFields'))},
        body: function(page)
        {
          var principal;

          return Principal.getFromPersistWithQuery(
            queryFilter({newEmail: { $regex: new RegExp("^" + this.email.toLowerCase().replace(/([^0-9a-zA-Z])/g, "\\$1") + '$', "i") }}),
            null, null, null, true
          ).then( function (principals) {
            if (principals.length == 0) {
              log(1, "Log In attempt for " + this.email + " failed (invalid email)");
              throw {code: "invalid_email_or_password",
                text: "Incorrect email or password"};
            }
            principal = principals[0];
            return principal.authenticate(this.password);
          }.bind(this)).then( function() {
            return Principal.getFromPersistWithId(principal._id);
          }.bind(this)).then( function(p) {
            principal = p;
            if (principal.mustChangePassword && !this.newPassword)
              throw {code: "changePassword", text: "Please change your password"};
            return principal.mustChangePassword ? this.changePasswordForPrincipal(principal) : Q(true);
          }.bind(this)).then( function (status) {
            return principal.consumeEmailVerificationCode(this.verifyEmailCode);
          }.bind(this)).then(function(){
            this.setLoggedInState(principal);

            principal.email = this.email;
            principal.newEmail = ""; // No need to track the changed email anymore
            principal.persistSave();

            // Send an email changed confirmation email
            this.sendEmail("confirm_emailchange", this.email, principal.email,
              principal.firstName + " " + principal.lastName, [
                {name: "email", content: this.email},
                {name: "firstName", content: principal.firstName}
              ]);

            return page ? this.setPage(page) : Q(true);
          }.bind(this))
        }},

      /**
       *  Set up all fields to indicate logged in
       */
      setLoggedInState: function (principal)
      {
        this.loggedIn = true;
        this.loggedInRole = principal.role;
        this[principalProperty] = principal;

        // One way so you can't spoof from client
        this.securityContext = new SecurityContext(principal, principal.role);
      },

      /**
       *  Set up all fields to indicate logged out
       */
      setLoggedOutState: function ()
      {
        this[principalProperty] = null;
        this.loggedIn = false;
        this.loggedInRole = null;
        this.securityContext = null;
      },

      /*
       * logout the current user
       */
      publicLogout: {on: "server", body: function(page)
      {
        log(1, "Customer " + this.email + " logged out");
        this.setLoggedOutState();
        return page ? this.setPage(page) : Q(true);
      }},

      /**
       * change an email address for a logged in user
       */
      changeEmail: {
        on: "server",
        validate: function () {
          return this.validate(document.getElementById('changeEmailFields'))},
        body: function(page, url)
        {
          url = urlparser.parse(url, true);
          var principal = this[principalProperty];
          var oldEmail = principal.email;
          var newEmail = this.newEmail;

          return Q(true).then(function () {
            return principal.authenticate(this.password, null, true);
          }.bind(this)).then (function () {
            return Principal.countFromPersistWithQuery(queryFilter({email: newEmail}))
          }.bind(this)).then(function (count) {
            if (count > 0)
              throw {code: "email_registered", text:"This email already registered"};
          }.bind(this)).then( function() {
            if (moduleConfig.validateEmail)
              return principal.setEmailVerificationCode();
            else {
              return Q(false);
            }
          }.bind(this)).then( function() {
            if (!deferEmailChange)
              this.email = newEmail;

            principal.newEmail = newEmail;
            principal.persistSave();

            // Send an email to old email address which is purely informational
            this.sendEmail("email_changed", oldEmail, principal.email,
              principal.firstName + " " + principal.lastName, [
                {name: "oldEmail", content: oldEmail},
                {name: "email", content: newEmail},
                {name: "firstName", content: principal.firstName}
              ]);

            // Send an email to new email address asking to verify the new email
            // address
            this.sendEmail(moduleConfig.validateEmail ? "email_changed_verify" : "email_changed",
              newEmail,  principal.firstName + " " + principal.lastName, [
                {name: "oldEmail", content: oldEmail},
                {name: "email", content: newEmail},
                {name: "firstName", content: principal.firstName},
                {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
                (url.port > 1000 ? ':' + url.port : '') +
                "?email=" + encodeURIComponent(newEmail) +
                "&code=" + principal.validateEmailCode + (deferEmailChange ? "#verify_email_change" : "#verify_email")},
                {name: "verificationCode", content: principal.validateEmailCode}
              ]);

            log(1, "Changed email " + oldEmail + " to " + newEmail);

            return page ? this.setPage(page) : Q(true);

          }.bind(this));
        }},
      resendChangeEmailValidationCode: {
        on: "server",
        validate: function () {
          return this.validate(document.getElementById('changeEmailFields'))},
        body: function(url)
        {
          url = urlparser.parse(url, true);
          var principal = this[principalProperty];
          this.sendEmail("email_verify", principal.email, principal.firstName + " " + principal.lastName, [
            {name: "email", content: principal.email},
            {name: "firstName", content: principal.firstName},
            {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
            (url.port > 1000 ? ':' + url.port : '') +
            "?email=" + encodeURIComponent(principal.email) +
            "&code=" + principal.validateEmailCode + "#verify_email"},
            {name: "verificationCode", content: principal.validateEmailCode}
          ]);

          log(1, "Resent email validation code to " + principal.email);
        }},
      /**
       * Change the password for a logged in user verifying old password
       * Also called from login on a force change password so technically you don't have to be logged in
       */
      changePassword: {
        on: "server",
        validate: function () {return this.validate(document.getElementById('changePasswordFields'))},
        body: function(page)
        {
          if (!this.loggedIn)
            throw {code: "not_loggedin", text:"Not logged in"};
          return this.changePasswordForPrincipal(this[principalProperty], page);
        }},


      changePasswordForPrincipal: function (principal, page) {
        return principal.authenticate(this.password, true).then(function()
        {
          return principal.establishPassword(this.newPassword,
            passwordExpiresMinutes ?
              new Date((new Date()).getTime() + passwordExpiresMinutes * 1000 * 60) : null).then(function ()
          {
            log(1, "Changed password for " + principal.email);
            if (this.sendEMail)
              this.sendEmail("password_changed",
                principal.email, principal.firstName,
                [
                  {name: "firstName", content: principal.firstName}
                ]);

            return page ? this.setPage(page) : Q(true);

          }.bind(this))

        }.bind(this));
      },
      /**
       * Request that an email be sent with a password change link
       */
      publicResetPassword: {
        on: "server",
        validate: function () {return this.validate(document.getElementById('publicResetPasswordFields'))},
        body: function(url, page)
        {
          url = urlparser.parse(url, true);
          log(1, "Request password reset for " + this.email);
          return Principal.getFromPersistWithQuery(queryFilter({email: this.email}), null, null, null, true).then(function (principals)
          {
            if (principals.length < 1)
              throw {code: "invalid_email", text:"Incorrect email"};
            var principal = principals[0];

            return principal.setPasswordChangeHash().then (function (token)
            {
              this.sendEmail("password_reset",
                this.email, principal.firstName, [
                  {name: "link", content: url.protocol + "//" + url.host.replace(/:.*/, '') +
                  (url.port > 1000 ? ':' + url.port : '') +
                  "?email=" + encodeURIComponent(this.email) +
                  "&token=" + token + "#reset_password_from_code"},
                  {name: "firstName", content: principal.firstName}
                ]);

              return page ? this.setPage(page) : Q(true);

            }.bind(this));

          }.bind(this))
        }},

      /**
       * Change the password given the token and log the user in
       * Token was generated in publicResetPassword and kept in principal entity to verify
       */
      publicChangePasswordFromToken: {
        on: "server",
        validate: function () {return this.validate(document.getElementById('publicChangePasswordFromTokenFields'))},
        body: function(page)
        {
          var principal;

          return Principal.getFromPersistWithQuery(queryFilter({email:this.email}), null, null, null, true).then(function (principals)
          {
            if (principals.length < 1)
              throw {code: "ivalid_password_change_token",
                text: "Invalid password change link - make sure you copied correctly from the email"};

            principal = principals[0];
            return principal.consumePasswordChangeToken(this.passwordChangeHash, this.newPassword);

          }.bind(this)).then( function() {
            return Principal.getFromPersistWithId(principal._id);
          }.bind(this)).then( function(p) {
            principal = p;
            return principal.establishPassword(this.newPassword)

          }.bind(this)).then(function ()
          {
            this.setLoggedInState(principal)
            return page ? this.setPage(page) : Q(true);

          }.bind(this))
        }},

      /**
       * Verify the email code
       */
      publicVerifyEmailFromCode: {on: "server", body: function(page)
      {
        var principal;

        return Principal.getFromPersistWithQuery(queryFilter({email:this.email}), null, null, null, true).then(function (principals)
        {
          if (principals.length < 1)
            throw {code: "invalid_email_verification_code",
              text: "Invalid verification link - make sure you copied correctly from the email"};

          principal = principals[0];
          return principal.consumeEmailVerificationCode(this.verifyEmailCode);

        }.bind(this)).then(function ()
        {
          return page ? this.setPage(page) : Q(true);

        }.bind(this))
      }},

      /**
       * Verify the email code assuming principal already in controller
       */
      privateVerifyEmailFromCode: {on: "server", body: function(verifyEmailCode)
      {
        var principal = this[principalProperty];
        try {
          return principal.consumeEmailVerificationCode(verifyEmailCode);
        } catch (e) {
          return Q(false);
        }
      }}
    });
}