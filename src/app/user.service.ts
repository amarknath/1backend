import { Injectable } from '@angular/core';
import * as types from './types';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SessionService } from './session.service';
import { ConstService } from './const.service';
import { Observable } from 'rxjs/Observable';

interface LoginResponse {
  token: types.AccessToken;
}

interface RegisterResponse {
  token: types.AccessToken;
}

@Injectable()
export class UserService {
  user: types.User = {} as types.User;
  loggedIn(): boolean {
    return this.sess.getToken().length > 0;
  }

  constructor(
    private http: HttpClient,
    private _const: ConstService,
    private sess: SessionService
  ) {
    this.get().then(user => {
      for (const k of Object.keys(user)) {
        this.user[k] = user[k];
      }
    });
  }

  // gets current user
  get(): Promise<types.User> {
    return new Promise<types.User>((resolve, reject) => {
      if (!this.sess.getToken() || this.sess.getToken().length === 0) {
        setTimeout(function() {
          resolve({} as types.User);
        }, 1); // hack to get around navbar router.isActive not being ready immediately
        return;
      }
      this.http
        .get<types.User>(
          this._const.url + '/v1/user?token=' + this.sess.getToken()
        )
        .toPromise()
        .then(user => {
          for (const k of Object.keys(user)) {
            this.user[k] = user[k];
          }
          resolve(user);
        });
    });
  }

  getByNick(nick: string): Promise<types.User> {
    let p = new HttpParams();
    p = p.set('token', this.sess.getToken());
    p = p.set('nick', nick);
    return new Promise<types.User>((resolve, reject) => {
      this.http
        .get<types.User>(this._const.url + '/v1/user', { params: p })
        .toPromise();
    });
  }

  save(u: types.User): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.http
        .post(this._const.url + '/v1/user', {
          password: u.Password,
          user: {
            Name: u.Name,
            Id: u.Id
          },
          token: this.sess.getToken()
        })
        .toPromise();
    });
  }

  // saves the object in the user service
  saveSelf(): Observable<void> {
    return this.http.put<void>(this._const.url + '/v1/user', {
      user: {
        avatarLink: this.user.AvatarLink,
        name: this.user.Name,
        email: this.user.Email,
        nick: this.user.Nick
      },
      token: this.sess.getToken()
    });
  }

  login(email: string, password: string): Promise<LoginResponse> {
    return new Promise<LoginResponse>((resolve, reject) => {
      this.http
        .post<LoginResponse>(this._const.url + '/v1/login', {
          email: email,
          password: password
        })
        .toPromise()
        .then(loginResp => {
          this.sess.setToken(loginResp.token.Token);
          resolve(loginResp);
        });
    });
  }

  register(
    userName: string,
    email: string,
    password: string
  ): Promise<LoginResponse> {
    return new Promise<LoginResponse>((resolve, reject) => {
      this.http
        .post<RegisterResponse>(this._const.url + '/v1/register', {
          nick: userName,
          email: email,
          password: password
        })
        .toPromise()
        .then(registerResp => {
          this.sess.setToken(registerResp.token.Token);
          resolve(registerResp);
        });
    });
  }
}
