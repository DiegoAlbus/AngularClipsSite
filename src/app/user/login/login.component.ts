import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  credentials = {
    email: '',
    password: ''
  }

  constructor(private auth: AngularFireAuth) { }

  ngOnInit(): void {

  }

  inSubmission = false;
  showAlert = false;
  alertMsg = 'Please wait! We are logging you in.';
  alertColor = 'blue';

  async login() {
    try{
      this.inSubmission = true;
      this.showAlert = true;
      this.alertMsg = 'Please wait! We are logging you in.';
      this.alertColor = 'blue';

      await this.auth.signInWithEmailAndPassword(
        this.credentials.email, this.credentials.password
      )
    } catch (e) {
      // Handle response
      console.log(e);

      this.alertMsg = 'An unexpected error ocurred. Please try again later.';
      this.alertColor = 'red';
      this.inSubmission = false;
      return;
    }

    this.alertMsg = 'Your account has been logged succesfully.';
    this.alertColor = 'green';
  }

}
