package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.PinOtpChallenge;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PinOtpChallengeRepository implements PanacheRepositoryBase<PinOtpChallenge, String> {}
