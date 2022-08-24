import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import IUser from '../models/user.model';
import { delay, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
  export class AuthService {
  
    private usersCollection: AngularFirestoreCollection<IUser>;
    public isAuthenticated$ : Observable<boolean> // $ common practice for observables
    public isAuthenticatedWithDelay$: Observable<boolean>;

  constructor(private auth: AngularFireAuth, private db: AngularFirestore){
    this.usersCollection = db.collection('users');
    this.isAuthenticated$ = auth.user.pipe(
      map(user => !!user)
    );

    this.isAuthenticatedWithDelay$ = this.isAuthenticated$.pipe(
      delay(1000)
    );

    auth.user.subscribe(console.log);
  }

  public async createUser(userData: IUser) {

    // const {email, password} = this.registerForm.value;
    if (!userData.password) {
      throw new Error("Password not provided");
    }

    // FIRST IT AUTENTICATES
    const userCred = await this.auth.createUserWithEmailAndPassword(userData.email as string, userData.password); // Sends request to firebase
      // console.log(userCred);
      
    if (!userCred.user){
      throw new Error("User can't be found");
    }

    // THEN IT WRITES TO DATABASE
      await this.usersCollection.doc(userCred.user?.uid).set({ // Looks for user ID
        name : userData.name,
        email: userData.email,
        age: userData.age,
        phoneNumber: userData.phoneNumber
      });

      await userCred.user.updateProfile({
        displayName: userData.name
      })

  }
}
