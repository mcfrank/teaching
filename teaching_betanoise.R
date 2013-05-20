rm(list=ls())
library(coda)
library(rjags)

## SETTINGS
n.iter <- 100000
true.bound <- .5
nu <- c(.1,1,10,100)
n.students <- length(nu)
distances <- seq(.05,.45,.05)

performance <- matrix(nrow=length(nu),ncol=length(distances))

for (d in 1:length(distances)) { 
  examples <- c(true.bound - distances[d],true.bound + distances[d])
  x.p <- rep(examples[1],n.students)
  y.p <- rep(examples[2],n.students)
  
  test.examples <- c(.4,.6)
  n.test <- length(test.examples)
  test <- matrix(rep(test.examples,n.students),
                 ncol=n.test,nrow=n.students,
                 byrow=TRUE)
  
  ## run model
  m <- jags.model("teaching2.bug")
  coda.res <- coda.samples(m,c("h","label"),n.iter=n.iter)
  
  b <- data.frame(coda.res[[1]])
  b$trial <- 1:nrow(b)
  mb <- melt(b,id.vars="trial")

#     qplot(value,geom="density",facets=~variable,
#         data=subset(mb,grepl("h",variable)))
  
  
  results <- matrix(as.numeric(colMeans(b[,grepl("label",names(b))])),nrow=n.students,ncol=n.test,byrow=FALSE)
  results[,test.examples < true.bound] <- 1 - results[,test.examples < true.bound] 
  performance[,d] <- rowMeans(results)
  
  # qplot(log(nu),performance,geom="line") + 
  #   ylim(c(0,1)) + 
  #   geom_hline(aes(yintercept=.5),lty=2)
}

##
p <- data.frame(performance)
names(p) <- distances
p$nu <- nu
mp <- melt(p,id.vars= c("nu"))

qplot(variable,value,colour=factor(nu),group=factor(nu),
      geom="line",data=mp) + 
  ylab("performance") + 
  xlab("distance") + 
  geom_hline(aes(yintercept=.5),lty=2)